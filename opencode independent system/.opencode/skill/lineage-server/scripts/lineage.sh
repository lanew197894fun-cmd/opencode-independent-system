#!/bin/bash
set -e

CONFIG_DIR="${HOME}/.opencode/lineage-server"
CONFIG_FILE="${CONFIG_DIR}/config.json"
LOG_DIR="${CONFIG_DIR}/logs"

mkdir -p "$CONFIG_DIR" "$LOG_DIR"

load_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    cat > "$CONFIG_FILE" << 'EOF'
{
  "default": "remastered",
  "servers": {
    "remastered": {
      "path": "/home/reamaster/REMASTER_KINGDOM",
      "jar": "TheDay.jar",
      "port": 7777,
      "db": "remaster_reboot_tw"
    },
    "385": {
      "path": "/home/reamaster/貓神/385",
      "bin": "bin",
      "port": 7777
    },
    "182": {
      "path": "/home/reamaster/docker-182",
      "docker_compose": "docker-compose.yml",
      "db_container": "l1j182_db"
    }
  }
}
EOF
  fi
  cat "$CONFIG_FILE"
}

get_server_config() {
  local version="$1"
  load_config | jq -r ".servers.\"$version\" // empty"
}

get_default_version() {
  load_config | jq -r '.default'
}

check_java() {
  if ! command -v java &> /dev/null; then
    echo "Error: Java not found"
    exit 1
  fi
  java -version 2>&1 | head -1
}

check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found"
    exit 1
  fi
  docker --version
}

cmd_status() {
  local version="${1:-$(get_default_version)}"
  local cfg=$(get_server_config "$version")
  
  if [[ -z "$cfg" ]]; then
    echo "Unknown version: $version"
    exit 1
  fi
  
  local path=$(echo "$cfg" | jq -r '.path')
  echo "=== $version ($path) ==="
  
  case "$version" in
    182)
      check_docker
      echo "Docker containers:"
      cd "$path" && docker-compose ps 2>/dev/null || docker ps | grep -i l1j || echo "No containers running"
      ;;
    *)
      if pgrep -f "TheDay.jar" &> /dev/null; then
        echo "Status: RUNNING"
      else
        echo "Status: STOPPED"
      fi
      ;;
  esac
}

cmd_start() {
  local version="${1:-$(get_default_version)}"
  local cfg=$(get_server_config "$version")
  local path=$(echo "$cfg" | jq -r '.path')
  
  echo "Starting $version..."
  
  case "$version" in
    remastered)
      local jar=$(echo "$cfg" | jq -r '.jar')
      cd "$path" && nohup java -Xmx4g -jar "$jar" > "$LOG_DIR/${version}.log" 2>&1 &
      echo "Started $jar"
      ;;
    385)
      cd "$path" && nohup java -cp bin l1j.server.Server > "$LOG_DIR/${version}.log" 2>&1 &
      echo "Started Server"
      ;;
    182)
      cd "$path" && docker-compose up -d
      echo "Docker containers started"
      ;;
  esac
  
  sleep 2
  cmd_status "$version"
}

cmd_stop() {
  local version="${1:-$(get_default_version)}"
  local cfg=$(get_server_config "$version")
  local path=$(echo "$cfg" | jq -r '.path')
  
  echo "Stopping $version..."
  
  case "$version" in
    remastered|385)
      pkill -f "TheDay.jar" 2>/dev/null || pkill -f "l1j.server.Server" 2>/dev/null || echo "No process found"
      ;;
    182)
      cd "$path" && docker-compose down
      ;;
  esac
  
  sleep 1
  cmd_status "$version"
}

cmd_restart() {
  cmd_stop "$1"
  sleep 2
  cmd_start "$1"
}

cmd_log() {
  local version="${1:-$(get_default_version)}"
  local lines="${2:-50}"
  
  if [[ -f "$LOG_DIR/${version}.log" ]]; then
    tail -n "$lines" "$LOG_DIR/${version}.log"
  else
    echo "No log file: $LOG_DIR/${version}.log"
  fi
}

cmd_log_error() {
  local version="${1:-$(get_default_version)}"
  cmd_log "$version" 100 | grep -i "error\|exception\|fail" || echo "No errors found"
}

cmd_db_backup() {
  local version="${1:-$(get_default_version)}"
  local name="${2:-backup_$(date +%Y%m%d_%H%M%S)}"
  local cfg=$(get_server_config "$version")
  local path=$(echo "$cfg" | jq -r '.path')
  local db=$(echo "$cfg" | jq -r '.db // "l1jdb"')
  
  echo "Backing up database: $db"
  
  case "$version" in
    182)
      local container=$(echo "$cfg" | jq -r '.db_container // "l1j182_db"')
      docker exec "$container" mysqldump -u root -proot "$db" > "${path}/${name}.sql" 2>/dev/null
      ;;
    *)
      if [[ -f "${path}/${db}.sql" ]]; then
        cp "${path}/${db}.sql" "${path}/${name}.sql"
      fi
      ;;
  esac
  
  echo "Backup saved: ${path}/${name}.sql"
}

cmd_db_list() {
  local version="${1:-$(get_default_version)}"
  local cfg=$(get_server_config "$version")
  local path=$(echo "$cfg" | jq -r '.path')
  
  echo "=== Database Backups ==="
  ls -lt "${path}"/*.sql 2>/dev/null | head -20 || echo "No backups found"
}

cmd_db_restore() {
  local version="${1:-$(get_default_version)}"
  local backup="${2}"
  local cfg=$(get_server_config "$version")
  local path=$(echo "$cfg" | jq -r '.path')
  
  if [[ -z "$backup" ]]; then
    echo "Usage: lineage db restore <backup_file>"
    exit 1
  fi
  
  echo "Restoring from: $backup"
  
  case "$version" in
    182)
      local container=$(echo "$cfg" | jq -r '.db_container // "l1j182_db"')
      docker exec -i "$container" mysql -u root -proot < "$backup"
      ;;
    *)
      echo "Restore not implemented for this version"
      ;;
  esac
}

cmd_docker_logs() {
  local follow=""
  [[ "$1" == "--follow" ]] && follow="-f"
  cd /home/reamaster/docker-182 && docker-compose logs $follow
}

cmd_version() {
  echo "Lineage Server Manager v1.0.0"
  echo ""
  load_config | jq -r '.servers | keys[]' | while read v; do
    echo "- $v"
  done
  echo ""
  echo "Default: $(get_default_version)"
}

cmd_config() {
  load_config | jq .
}

cmd_set_default() {
  local version="$1"
  if [[ -z "$version" ]]; then
    echo "Usage: lineage set-default <version>"
    exit 1
  fi
  
  local tmp=$(mktemp)
  load_config | jq --arg v "$version" '.default = $v' > "$tmp"
  mv "$tmp" "$CONFIG_FILE"
  echo "Default version set to: $version"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cmd_farming() {
  shift
  "$SCRIPT_DIR/farming.sh" "$@"
}

cmd_help() {
  cat << 'EOF'
Lineage Server Manager v1.0.0

Usage: lineage <command> [args]

Server Commands:
  status [version]     Show server status
  start [version]      Start server
  stop [version]       Stop server
  restart [version]    Restart server
  log [version] [n]    View logs (last n lines)
  log:error [version]  Show errors only

Database Commands:
  db:backup [v] [name] Backup database
  db:list [version]    List backups
  db:restore <file>   Restore from backup

Docker Commands (182):
  docker:logs [--f]   Docker logs

Farming Commands:
  farming spots [--level N]   List farming spots
  farming map <map_id>        View map mobs
  farming mob <mob_id>        View mob info
  farming bosses              List boss areas
  farming suggest <level>     Farming suggestion (1-80)
  farming stats <map_id>      Map statistics

Config Commands:
  version              Show versions
  config               Show config
  set-default <v>      Set default version

Versions: remastered, 385, 182
EOF
}

case "${1:-}" in
  status) cmd_status "$2" ;;
  start) cmd_start "$2" ;;
  stop) cmd_stop "$2" ;;
  restart) cmd_restart "$2" ;;
  log) cmd_log "$2" "$3" ;;
  log:error) cmd_log_error "$2" ;;
  db:backup) cmd_db_backup "$2" "$3" ;;
  db:list) cmd_db_list "$2" ;;
  db:restore) cmd_db_restore "$2" "$3" ;;
  docker:logs) cmd_docker_logs "$2" ;;
  farming) cmd_farming "$@" ;;
  version) cmd_version ;;
  config) cmd_config ;;
  set-default) cmd_set_default "$2" ;;
  help|--help|-h) cmd_help ;;
  *) 
    cmd_help
    ;;
esac

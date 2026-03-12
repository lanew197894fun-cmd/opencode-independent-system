use tauri::command;
use std::process::Command;
use std::net::TcpStream;
use std::time::Duration;
use log::{info, debug, error};

/// 偵測路由器連線狀態
#[command]
pub async fn check_router_status(gateway_ip: Option<String>) -> Result<bool, String> {
    let ip = gateway_ip.unwrap_or("192.168.1.1".to_string());
    info!("[網路] 偵測路由器狀態: {}", ip);

    #[cfg(unix)]
    {
        let output = Command::new("ping")
            .args(["-c", "1", "-W", "1", &ip])
            .output();
        
        match output {
            Ok(out) if out.status.success() => {
                debug!("[網路] 路由器 {} 運作正常", ip);
                Ok(true)
            },
            _ => {
                error!("[網路] 無法連線到路由器 {}", ip);
                Ok(false)
            }
        }
    }
    
    #[cfg(windows)]
    {
        let output = Command::new("ping")
            .args(["-n", "1", "-w", "1000", &ip])
            .output();
            
        match output {
            Ok(out) if out.status.success() => {
                debug!("[網路] 路由器 {} 運作正常", ip);
                Ok(true)
            },
            _ => {
                error!("[網路] 無法連線到路由器 {}", ip);
                Ok(false)
            }
        }
    }
}

/// 偵測伺服器埠號監測
#[command]
pub async fn check_server_port(host: String, port: u16, timeout_ms: u64) -> Result<bool, String> {
    info!("[網路] 偵測伺服器埠號: {}:{}", host, port);
    
    let address = format!("{}:{}", host, port);
    let timeout = Duration::from_millis(timeout_ms);
    
    // 解析地址，避免 unwrap panic
    let socket_addr = match address.parse() {
        Ok(addr) => addr,
        Err(e) => {
            error!("[網路] 地址解析失敗 {}: {}", address, e);
            return Ok(false);
        }
    };
    
    match TcpStream::connect_timeout(&socket_addr, timeout) {
        Ok(_) => {
            debug!("[網路] 埠號 {} 連線成功", address);
            Ok(true)
        },
        Err(e) => {
            error!("[網路] 埠號 {} 連線失敗: {}", address, e);
            Ok(false)
        }
    }
}

/// 即時修復網路狀態
#[command]
pub async fn repair_network_status() -> Result<String, String> {
    info!("[網路] 開始執行網路狀態修復...");

    #[cfg(unix)]
    {
        // 嘗試刷新 DNS 快取 (Linux/macOS)
        let _ = Command::new("sudo")
            .args(["dscacheutil", "-flushcache"])
            .output();
        
        // 嘗試重置網路介面 (需要權限，這裡僅示意)
        // 實際實現可能需要偵測主要介面並重啟
        
        info!("[網路] 修復指令執行完畢");
        Ok("網路修復指令已執行".to_string())
    }
    
    #[cfg(windows)]
    {
        // Windows: 重置 Winsock 和 DNS 快取
        let _ = Command::new("ipconfig")
            .args(["/flushdns"])
            .output();
            
        let _ = Command::new("netsh")
            .args(["winsock", "reset"])
            .output();
            
        info!("[網路] Windows 網路修復指令執行完畢");
        Ok("Windows 網路修復指令已執行".to_string())
    }
}

/// 自動偵測系統預設網關
#[command]
pub async fn get_default_gateway() -> Result<String, String> {
    info!("[網路] 自動偵測預設網關...");
    
    #[cfg(unix)]
    {
        // Linux/macOS: 從路由表取得預設網關
        let output = Command::new("ip")
            .args(["route", "show", "default"])
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            // 解析輸出，例如: "default via 192.168.1.1 dev eth0"
            for line in output_str.lines() {
                if line.starts_with("default") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 3 && parts[1] == "via" {
                        let gateway = parts[2].to_string();
                        info!("[網路] 偵測到網關: {}", gateway);
                        return Ok(gateway);
                    }
                }
            }
        }
        
        // macOS 備用方法
        let output = Command::new("netstat")
            .args(["-nr"])
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            for line in output_str.lines() {
                if line.starts_with("default") {
                    let parts: Vec<&str> = line.split_whitespace();
                    if let Some(gateway) = parts.get(1) {
                        return Ok(gateway.to_string());
                    }
                }
            }
        }
        
        Ok("192.168.1.1".to_string())
    }
    
    #[cfg(windows)]
    {
        // Windows: 使用 ipconfig 取得預設網關
        let output = Command::new("ipconfig")
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            for line in output_str.lines() {
                if line.contains("Default Gateway") || line.contains("默认网关") {
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 2 {
                        let ip = parts[1].trim();
                        if !ip.is_empty() && ip != "" {
                            return Ok(ip.to_string());
                        }
                    }
                }
            }
        }
        
        Ok("192.168.1.1".to_string())
    }
}

/// 網關資訊
#[derive(serde::Serialize, Clone)]
pub struct GatewayInfo {
    pub ip: String,
    pub interface: String,
    pub is_default: bool,
}

/// 偵測所有網關（適用於多層路由）
#[command]
pub async fn get_all_gateways() -> Result<Vec<GatewayInfo>, String> {
    info!("[網路] 偵測所有網關...");
    
    let mut gateways: Vec<GatewayInfo> = Vec::new();
    
    #[cfg(unix)]
    {
        // 使用 ip route 取得所有路由
        let output = Command::new("ip")
            .args(["route"])
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            for line in output_str.lines() {
                if line.starts_with("default") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    let ip = parts.get(2).unwrap_or(&"").to_string();
                    let iface = parts.get(4).unwrap_or(&"").to_string();
                    if !ip.is_empty() {
                        gateways.push(GatewayInfo {
                            ip: ip.clone(),
                            interface: iface,
                            is_default: true,
                        });
                    }
                }
            }
        }
        
        // 也偵測所有本地網段
        let output = Command::new("ip")
            .args(["-4", "addr", "show"])
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            let mut current_iface = String::new();
            for line in output_str.lines() {
                if line.contains(": ") && !line.contains(": lo") {
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 2 {
                        current_iface = parts[1].trim().to_string();
                    }
                }
                if line.starts_with("    inet ") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let cidr = parts[1];
                        // 取得網段 IP (例如 192.168.50.1/24)
                        if let Some(network_ip) = cidr.split('/').next() {
                            // 取得該網段的閘道（通常是 .1）
                            if let Some(gateway_ip) = network_ip.rsplit('.').next() {
                                let base: String = network_ip[..network_ip.len() - gateway_ip.len() - 1].to_string();
                                let potential_gateway = format!("{}.1", base);
                                // 檢查是否已在列表中
                                if !gateways.iter().any(|g| g.ip == potential_gateway) {
                                    gateways.push(GatewayInfo {
                                        ip: potential_gateway,
                                        interface: current_iface.clone(),
                                        is_default: false,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    #[cfg(windows)]
    {
        // Windows: 使用 route print
        let output = Command::new("route")
            .args(["print", "0.0.0.0"])
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            for line in output_str.lines() {
                if line.contains("0.0.0.0") && !line.starts_with("Network") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 3 {
                        let gateway = parts[2].to_string();
                        if gateway != "0.0.0.0" && !gateway.contains("::") {
                            gateways.push(GatewayInfo {
                                ip: gateway,
                                interface: String::new(),
                                is_default: true,
                            });
                        }
                    }
                }
            }
        }
    }
    
    info!("[網路] 偵測到 {} 個網關", gateways.len());
    Ok(gateways)
}

/// WiFi 連線狀態
#[derive(serde::Serialize)]
pub struct WifiStatus {
    pub connected: bool,
    pub ssid: String,
    pub signal_strength: i32,
    pub ip_address: String,
    pub channel: u32,
    pub frequency: u32,
}

/// 偵測 WiFi 連線狀態
#[command]
pub async fn get_wifi_status() -> Result<WifiStatus, String> {
    info!("[網路] 偵測 WiFi 連線狀態...");
    
    #[cfg(target_os = "linux")]
    {
        // Linux: 使用 nmcli 或 iwgetid
        let output = Command::new("nmcli")
            .args(["-t", "-f", "NAME,TYPE,STATE", "connection", "show", "--active"])
            .output();
            
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            for line in output_str.lines() {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() >= 3 && parts[1] == "802-11-wireless" {
                    return Ok(WifiStatus {
                        connected: true,
                        ssid: parts[0].to_string(),
                        signal_strength: 75, // 需要額外查詢
                        ip_address: String::new(),
                        channel: 0,
                        frequency: 0,
                    });
                }
            }
        }
        
        Ok(WifiStatus {
            connected: false,
            ssid: String::new(),
            signal_strength: 0,
            ip_address: String::new(),
            channel: 0,
            frequency: 0,
        })
    }
    
    #[cfg(target_os = "macos")]
    {
        // macOS: 使用 networksetup
        let output = Command::new("networksetup")
            .args(["-getairportnetwork", "en0"])
            .output();
            
        let ssid = if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            output_str.trim().to_string()
        } else {
            String::new()
        };
        
        let connected = !ssid.is_empty() && !ssid.contains("Off");
        
        Ok(WifiStatus {
            connected,
            ssid,
            signal_strength: 0,
            ip_address: String::new(),
            channel: 0,
            frequency: 0,
        })
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows: 使用 netsh
        let output = Command::new("netsh")
            .args(["wlan", "show", "interfaces"])
            .output();
            
        let mut ssid = String::new();
        let mut signal = 0;
        
        if let Ok(out) = output {
            let output_str = String::from_utf8_lossy(&out.stdout);
            for line in output_str.lines() {
                if line.contains("SSID") && !line.contains("BSSID") {
                    if let Some(s) = line.split(':').nth(1) {
                        ssid = s.trim().to_string();
                    }
                }
                if line.contains("Signal") {
                    if let Some(s) = line.split(':').nth(1) {
                        let sig_str = s.trim().replace('%', "");
                        signal = sig_str.parse().unwrap_or(0);
                    }
                }
            }
        }
        
        Ok(WifiStatus {
            connected: !ssid.is_empty(),
            ssid,
            signal_strength: signal,
            ip_address: String::new(),
            channel: 0,
            frequency: 0,
        })
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    {
        Ok(WifiStatus {
            connected: false,
            ssid: String::from("不支援"),
            signal_strength: 0,
            ip_address: String::new(),
            channel: 0,
            frequency: 0,
        })
    }
}

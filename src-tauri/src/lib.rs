mod commands;
mod node;

use tauri::Manager;
use crate::node::Node;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_endpoint_id,
            commands::subscribe_mdns,
            commands::connect,
            commands::receive,
            commands::subscribe_recv,
            commands::send,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let node = Node::new().await.expect("init node");
                handle.manage(node);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

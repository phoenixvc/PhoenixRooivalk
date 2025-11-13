// Game engine - can be used for both WASM and native tests
pub mod game;

#[cfg(target_arch = "wasm32")]
mod components;

#[cfg(target_arch = "wasm32")]
mod tauri_api;

#[cfg(target_arch = "wasm32")]
pub use components::App;

#[cfg(target_arch = "wasm32")]
use leptos::prelude::*;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    mount_to_body(|| view! { <App /> });
}

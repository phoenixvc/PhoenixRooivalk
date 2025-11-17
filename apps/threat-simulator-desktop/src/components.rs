use leptos::prelude::*;

mod cooldown_meter;
mod drone_deployment;
mod energy_management;
mod event_feed;
mod game_canvas;
mod hud;
mod loading;
mod overlays;
mod research_panel;
mod stats_panel;
mod synergy_system;
mod token_store;
mod weapon_panel;

pub use drone_deployment::DroneDeploymentPanel;
pub use energy_management::EnergyManagement;
pub use event_feed::{create_feed_item, EventFeed, FeedItem, FeedSeverity};
pub use game_canvas::GameCanvas;
pub use hud::Hud;
pub use loading::LoadingIndicator;
pub use overlays::{AchievementNotification, IntegratedSimulationWarning};
pub use research_panel::ResearchPanel;
pub use stats_panel::StatsPanel;
pub use synergy_system::SynergySystem;
pub use token_store::TokenStore;
pub use weapon_panel::WeaponPanel;

use crate::game::{GameStateManager, WeaponType};
use wasm_bindgen::{closure::Closure, JsCast};
use web_sys::KeyboardEvent;

#[component]
pub fn App() -> impl IntoView {
    // Initialize game state manager
    let game_state = GameStateManager::new();

    // Reactive signals for UI state
    let (show_help, set_show_help) = signal(false);
    let (show_stats, set_show_stats) = signal(true); // Visible by default
    let (show_energy, set_show_energy) = signal(true); // Visible by default
    let (show_drones, set_show_drones) = signal(true); // Visible by default
    let (_show_warning, _set_show_warning) = signal(true);
    let (show_events, set_show_events) = signal(true); // Visible by default
    let (show_research, set_show_research) = signal(false);
    let (show_token_store, set_show_token_store) = signal(false);
    let (show_synergies, set_show_synergies) = signal(true); // Visible by default
    let (is_running, set_is_running) = signal(false); // Don't start until user clicks Start
    let (show_start_screen, set_show_start_screen) = signal(false); // Show after loading
    let (achievement_message, set_achievement_message) = signal(None::<String>);
    let (event_feed, set_event_feed) = signal(Vec::<FeedItem>::new());

    // Loading state
    let (is_loading, set_is_loading) = signal(true);
    let (loading_progress, set_loading_progress) = signal(0u8);

    // Watch for critical events - low health
    {
        let game_state_watcher = game_state.clone();
        let (last_warning_sent, set_last_warning_sent) = signal(false);
        Effect::new(move |_| {
            let health = game_state_watcher.mothership_health.get();
            if health < 25.0 && !last_warning_sent.get() {
                set_event_feed.update(|feed| {
                    feed.push(create_feed_item(
                        format!("CRITICAL: Mothership health at {}%!", health as u32),
                        FeedSeverity::Critical,
                    ));
                });
                set_last_warning_sent.set(true);
            } else if health >= 25.0 {
                set_last_warning_sent.set(false);
            }
        });
    }

    // Watch for wave changes
    {
        let game_state_watcher = game_state.clone();
        let (last_level, set_last_level) = signal(1u8);
        Effect::new(move |_| {
            let current_level = game_state_watcher.level.get();
            let previous_level = last_level.get();

            // Always update last_level to track changes
            set_last_level.set(current_level);

            // Only show feed message when level increases
            if current_level > previous_level {
                set_event_feed.update(|feed| {
                    feed.push(create_feed_item(
                        format!("Wave {} incoming!", current_level),
                        FeedSeverity::Warning,
                    ));
                });

                // Tutorial mode: gradually disable AI assistance
                if game_state_watcher.tutorial_mode.get() {
                    match current_level {
                        3 => {
                            // Reduce auto-targeting accuracy at wave 3
                            set_event_feed.update(|feed| {
                                feed.push(create_feed_item(
                                    "Tutorial: AI assistance reduced - take more control!"
                                        .to_string(),
                                    FeedSeverity::Info,
                                ));
                            });
                        }
                        5 => {
                            // Disable auto-targeting at wave 5
                            game_state_watcher.auto_targeting_enabled.set(false);
                            set_event_feed.update(|feed| {
                                feed.push(create_feed_item(
                                    "Tutorial: AI assistance disabled - you're in command!"
                                        .to_string(),
                                    FeedSeverity::Info,
                                ));
                            });
                        }
                        7 => {
                            // Complete tutorial at wave 7
                            game_state_watcher.complete_tutorial();
                            set_event_feed.update(|feed| {
                                feed.push(create_feed_item(
                                    "🎓 Tutorial completed! Future games will start in normal mode.".to_string(),
                                    FeedSeverity::Success,
                                ));
                            });
                        }
                        _ => {}
                    }
                }
            }
        });
    }

    // Watch for high scores
    {
        let game_state_watcher = game_state.clone();
        let (milestones_reached, set_milestones_reached) = signal(std::collections::HashSet::new());
        Effect::new(move |_| {
            let score = game_state_watcher.score.get();
            let milestones = [1000, 5000, 10000, 25000, 50000, 100000];

            // Clear milestones when score resets to 0
            if score == 0 {
                set_milestones_reached.set(std::collections::HashSet::new());
                return;
            }

            for &milestone in &milestones {
                if score >= milestone && !milestones_reached.get().contains(&milestone) {
                    set_event_feed.update(|feed| {
                        feed.push(create_feed_item(
                            format!("Achievement: {} points!", milestone),
                            FeedSeverity::Success,
                        ));
                    });
                    set_milestones_reached.update(|m| {
                        m.insert(milestone);
                    });
                }
            }
        });
    }

    // Keyboard event handler
    let game_state_kb = game_state.clone();
    {
        let window = web_sys::window().unwrap();
        let game_state_inner = game_state_kb.clone();
        let closure = Closure::wrap(Box::new(move |event: KeyboardEvent| {
            let key = event.key();

            match key.as_str() {
                " " => {
                    // Space - toggle pause (only if start screen is not visible)
                    if !show_start_screen.get() {
                        set_is_running.update(|r| *r = !*r);
                    }
                    event.prevent_default();
                }
                "h" | "H" | "?" => set_show_help.update(|h| *h = !*h),
                "s" | "S" => set_show_stats.update(|s| *s = !*s),
                "e" | "E" => set_show_energy.update(|e| *e = !*e),
                "d" | "D" => set_show_drones.update(|d| *d = !*d),
                "l" | "L" => set_show_events.update(|e| *e = !*e),
                "t" | "T" => set_show_token_store.update(|t| *t = !*t),
                "f" | "F" => set_show_research.update(|r| *r = !*r),
                "g" | "G" => set_show_synergies.update(|s| *s = !*s),
                "x" | "X" => game_state_inner.auto_targeting_enabled.update(|a| *a = !*a),
                "r" | "R" => {
                    game_state_inner.reset();
                    set_is_running.set(false);
                    set_event_feed.set(vec![create_feed_item(
                        "Game reset".to_string(),
                        FeedSeverity::Info,
                    )]);
                }
                // Weapon selection (1-9, 0, C, S, A)
                "1" => game_state_inner.selected_weapon.set(WeaponType::Kinetic),
                "2" => game_state_inner.selected_weapon.set(WeaponType::Electronic),
                "3" => game_state_inner.selected_weapon.set(WeaponType::Laser),
                "4" => game_state_inner.selected_weapon.set(WeaponType::Net),
                "5" => game_state_inner.selected_weapon.set(WeaponType::Hpm),
                "6" => game_state_inner.selected_weapon.set(WeaponType::RfTakeover),
                "7" => game_state_inner.selected_weapon.set(WeaponType::GnssDeny),
                "8" => game_state_inner
                    .selected_weapon
                    .set(WeaponType::OpticalDazzle),
                "9" => game_state_inner.selected_weapon.set(WeaponType::Acoustic),
                "0" => game_state_inner
                    .selected_weapon
                    .set(WeaponType::DecoyBeacon),
                "c" | "C" => game_state_inner.selected_weapon.set(WeaponType::Chaff),
                "a" | "A" => game_state_inner
                    .selected_weapon
                    .set(WeaponType::AiDeception),
                _ => {}
            }
        }) as Box<dyn FnMut(_)>);

        window
            .add_event_listener_with_callback("keydown", closure.as_ref().unchecked_ref())
            .unwrap();

        // Clean up on component unmount
        // Use StoredValue with LocalStorage to handle non-Send/Sync types in WASM
        let window_stored = StoredValue::new_local(window.clone());
        let closure_ref_stored =
            StoredValue::new_local(closure.as_ref().unchecked_ref::<js_sys::Function>().clone());
        on_cleanup(move || {
            let window = window_stored.get_value();
            let closure_ref = closure_ref_stored.get_value();
            let _ = window.remove_event_listener_with_callback("keydown", &closure_ref);
        });
        // Keep closure alive until cleanup
        std::mem::forget(closure);
    }

    // Clone game state for components
    let game_state_hud = game_state.clone();
    let game_state_canvas = game_state.clone();
    let game_state_energy = game_state.clone();
    let game_state_drones = game_state.clone();
    let game_state_tokens = game_state.clone();
    let game_state_weapons = game_state.clone();

    // Simulate loading progress with proper cleanup
    {
        use std::cell::RefCell;
        use std::rc::Rc;

        let animation_handle = Rc::new(RefCell::new(None::<i32>));
        let timeout_handle = Rc::new(RefCell::new(None::<i32>));

        let window = web_sys::window().unwrap();
        let window_clone = window.clone();
        let animate_handle = animation_handle.clone();
        let timeout_handle_inner = timeout_handle.clone();

        let animate_fn = Rc::new(RefCell::new(None::<Closure<dyn FnMut()>>));
        let animate_fn_clone = animate_fn.clone();

        *animate_fn.borrow_mut() = Some(Closure::wrap(Box::new(move || {
            // Stop if loading was cancelled
            if !is_loading.get_untracked() {
                return;
            }

            let progress = loading_progress.get_untracked();
            if progress < 90 {
                set_loading_progress.update(|p| *p += 1);
                // Queue next frame
                let handle = window_clone
                    .request_animation_frame(
                        animate_fn_clone
                            .borrow()
                            .as_ref()
                            .unwrap()
                            .as_ref()
                            .unchecked_ref(),
                    )
                    .unwrap();
                *animate_handle.borrow_mut() = Some(handle);
            } else if progress < 100 {
                set_loading_progress.set(100);
                // Once at 100%, schedule turning loading off and showing start screen
                let animate_handle_clone = animate_handle.clone();
                let timeout_closure = Closure::wrap(Box::new(move || {
                    set_is_loading.set(false);
                    set_show_start_screen.set(true); // Show start screen after loading completes
                                                     // Clear animation handle to stop further requests
                    *animate_handle_clone.borrow_mut() = None;
                }) as Box<dyn FnMut()>);
                let handle = window_clone
                    .set_timeout_with_callback_and_timeout_and_arguments_0(
                        timeout_closure.as_ref().unchecked_ref(),
                        500,
                    )
                    .unwrap();
                *timeout_handle_inner.borrow_mut() = Some(handle);
                std::mem::forget(timeout_closure);
            }
        }) as Box<dyn FnMut()>));

        // Kick off the first frame
        let handle = window
            .request_animation_frame(
                animate_fn
                    .borrow()
                    .as_ref()
                    .unwrap()
                    .as_ref()
                    .unchecked_ref(),
            )
            .unwrap();
        *animation_handle.borrow_mut() = Some(handle);

        // Clean up on unmount
        // Use StoredValue with LocalStorage to handle non-Send/Sync types in WASM
        let animation_handle_stored = StoredValue::new_local(animation_handle.clone());
        let timeout_handle_stored = StoredValue::new_local(timeout_handle.clone());
        let animate_fn_stored = StoredValue::new_local(animate_fn.clone());
        let window_stored = StoredValue::new_local(window.clone());
        on_cleanup(move || {
            let animation_handle = animation_handle_stored.get_value();
            let timeout_handle = timeout_handle_stored.get_value();
            let animate_fn = animate_fn_stored.get_value();
            let window = window_stored.get_value();

            if let Some(h) = animation_handle.borrow_mut().take() {
                window.cancel_animation_frame(h).ok();
            }
            if let Some(h) = timeout_handle.borrow_mut().take() {
                window.clear_timeout_with_handle(h);
            }
            animate_fn.borrow_mut().take();
        });
    }

    view! {
        <div class="app-container">
            // Loading screen
            <Show when=move || is_loading.get() fallback=|| view! { <div></div> }>
                <LoadingIndicator progress=loading_progress/>
            </Show>

            // Start screen - shows after loading completes
            <Show when=move || show_start_screen.get() fallback=|| view! { <div></div> }>
                <div class="start-screen">
                    <div class="start-content">
                        <h1 class="start-title">"Phoenix Rooivalk"</h1>
                        <h2 class="start-subtitle">"Counter-Drone Defense Simulator"</h2>

                        // Integrated warning (no close button)
                        <IntegratedSimulationWarning/>

                        // Tutorial mode indicator
                        {move || {
                            if game_state.tutorial_mode.get() && !game_state.tutorial_completed.get() {
                                view! {
                                    <div class="tutorial-indicator">
                                        <div class="tutorial-icon">"🤖"</div>
                                        <div class="tutorial-text">
                                            <p class="tutorial-title">"AI-ASSISTED TUTORIAL MODE"</p>
                                            <p class="tutorial-subtitle">"Auto-targeting enabled • AI assistance will reduce as you progress"</p>
                                        </div>
                                    </div>
                                }.into_any()
                            } else {
                                view! { <div></div> }.into_any()
                            }
                        }}

                        <div class="start-description">
                            <p>"Defend your mothership against waves of hostile drones."</p>
                            <p>"Deploy weapons, manage resources, and survive as long as you can."</p>
                        </div>
                        <button
                            class="start-button"
                            on:click=move |_| {
                                set_show_start_screen.set(false);
                                set_is_running.set(true);
                                set_event_feed.update(|feed| {
                                    feed.push(create_feed_item("Mission started".to_string(), FeedSeverity::Success));
                                });
                            }
                        >
                            "START MISSION"
                        </button>
                        <div class="start-controls">
                            <p><strong>"Controls:"</strong></p>
                            <p>"SPACE - Pause/Resume | R - Reset | H - Help"</p>
                            <p>"E - Energy | D - Drones | S - Stats | F - Events"</p>
                        </div>
                    </div>
                </div>
            </Show>

            // Achievement notifications
            <AchievementNotification
                message=achievement_message
                on_dismiss=move || set_achievement_message.set(None)
            />

            // AI Tutorial Indicator - shows when AI is active
            {move || {
                if game_state.tutorial_mode.get() && game_state.auto_targeting_enabled.get() && is_running.get() {
                    view! {
                        <div class="ai-indicator-overlay">
                            <div class="ai-indicator-badge">
                                <div class="ai-icon">"🤖"</div>
                                <div class="ai-text">
                                    <div class="ai-title">"AI ASSISTING"</div>
                                    <div class="ai-subtitle">"Auto-targeting enabled"</div>
                                </div>
                            </div>
                        </div>
                    }.into_any()
                } else {
                    view! { <div></div> }.into_any()
                }
            }}

            <Hud game_state=game_state_hud.clone() is_running=is_running/>

            <GameCanvas game_state=game_state_canvas.clone() is_running=is_running/>

            // Side panels
            <Show when=move || show_events.get() fallback=|| view! { <div></div> }>
                <div class="side-panel left">
                    <EventFeed feed_items=event_feed/>
                </div>
            </Show>

            <Show when=move || show_energy.get() fallback=|| view! { <div></div> }>
                <div class="side-panel right">
                    <EnergyManagement game_state=game_state_energy.clone()/>
                </div>
            </Show>

            <Show when=move || show_drones.get() fallback=|| view! { <div></div> }>
                <div class="side-panel right-lower">
                    <DroneDeploymentPanel game_state=game_state_drones.clone()/>
                </div>
            </Show>

            // Research Panel (full modal)
            <ResearchPanel show=show_research on_close=move || set_show_research.set(false)/>

            // Token Store (full modal)
            <TokenStore
                game_state=game_state_tokens.clone()
                show=show_token_store
                on_close=move || set_show_token_store.set(false)
            />

            // Synergy System (floating indicator)
            <SynergySystem
                active_weapons={
                    let game_state_synergy = game_state.clone();
                    let active_weapons_signal = RwSignal::new(Vec::new());

                    // Update the signal when weapons change
                    Effect::new(move |_| {
                        let weapons = game_state_synergy.weapons.get()
                            .into_iter()
                            .map(|w| w.weapon_type)
                            .collect::<Vec<_>>();
                        active_weapons_signal.set(weapons);
                    });

                    active_weapons_signal.read_only()
                }
                show=show_synergies
            />

            <div class="controls-footer">
                <div class="control-section">
                    <button
                        class="control-button primary"
                        on:click=move |_| {
                            set_is_running.update(|r| *r = !*r);
                            if is_running.get() {
                                set_event_feed
                                    .update(|feed| {
                                        feed.push(
                                            create_feed_item("Mission started".to_string(), FeedSeverity::Success),
                                        );
                                    });
                            } else {
                                set_event_feed
                                    .update(|feed| {
                                        feed.push(
                                            create_feed_item("Mission paused".to_string(), FeedSeverity::Warning),
                                        );
                                    });
                            }
                        }
                    >

                        {move || if is_running.get() { "⏸ PAUSE" } else { "▶ START" }}
                    </button>

                    <button
                        class="control-button"
                        on:click={
                            let game_state_reset = game_state.clone();
                            move |_| {
                                game_state_reset.reset();
                                set_is_running.set(false);
                                set_event_feed
                                    .set(vec![
                                        create_feed_item("Game reset".to_string(), FeedSeverity::Info),
                                    ]);
                            }
                        }
                    >

                        "↺ RESET"
                    </button>

                    // Restart Tutorial Button - only show if tutorial is completed
                    {
                        let game_state_check = game_state.clone();
                        move || {
                        if game_state_check.tutorial_completed.get() {
                            let game_state_tutorial = game_state_check.clone();
                            view! {
                                <button
                                    class="control-button tutorial-restart"
                                    on:click={
                                        move |_| {
                                            // Clear tutorial completion from localStorage
                                            if let Some(window) = web_sys::window() {
                                                if let Ok(Some(storage)) = window.local_storage() {
                                                    let _ = storage.remove_item("tutorial_completed");
                                                }
                                            }
                                            // Reset game and re-enable tutorial
                                            game_state_tutorial.tutorial_completed.set(false);
                                            game_state_tutorial.tutorial_mode.set(true);
                                            game_state_tutorial.auto_targeting_enabled.set(true);
                                            game_state_tutorial.reset();
                                            set_is_running.set(false);
                                            set_event_feed.set(vec![
                                                create_feed_item("Tutorial mode restarted".to_string(), FeedSeverity::Success),
                                            ]);
                                        }
                                    }
                                    title="Restart the tutorial with AI assistance"
                                >
                                    "🎓 RESTART TUTORIAL"
                                </button>
                            }.into_any()
                        } else {
                            view! { <div></div> }.into_any()
                        }
                    }}
                </div>

                <WeaponPanel game_state=game_state_weapons.clone()/>

                <div class="control-section">
                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_events.update(|e| *e = !*e);
                        }
                    >

                        "📜 LOG"
                    </button>

                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_energy.update(|e| *e = !*e);
                        }
                    >

                        "⚡ ENERGY"
                    </button>

                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_drones.update(|d| *d = !*d);
                        }
                    >

                        "🚁 DRONES"
                    </button>

                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_stats.update(|s| *s = !*s);
                        }
                    >

                        "📊 STATS"
                    </button>

                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_research.update(|r| *r = !*r);
                        }
                    >

                        "🔬 RESEARCH"
                    </button>

                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_token_store.update(|t| *t = !*t);
                        }
                    >

                        "🪙 STORE"
                    </button>

                    <button
                        class="control-button"
                        on:click=move |_| {
                            set_show_help.update(|h| *h = !*h);
                        }
                    >

                        "❓ HELP"
                    </button>
                </div>
            </div>

            <StatsPanel game_state=game_state.clone() show=show_stats/>

            // Help overlay
            <Show when=move || show_help.get() fallback=|| view! { <div></div> }>
                <div class="modal-overlay" on:click=move |_| set_show_help.set(false)>
                    <div class="help-modal" on:click=|e| e.stop_propagation()>
                        <h2>"Phoenix Rooivalk Threat Simulator"</h2>

                        <div class="help-section">
                            <h3>"Controls"</h3>
                            <ul>
                                <li>
                                    <kbd>"Space"</kbd>
                                    " - Pause/Resume"
                                </li>
                                <li>
                                    <kbd>"Click"</kbd>
                                    " - Target and fire at threats"
                                </li>
                                <li>
                                    <kbd>"1-9, 0"</kbd>
                                    " - Select weapons"
                                </li>
                                <li>
                                    <kbd>"R"</kbd>
                                    " - Reset game"
                                </li>
                                <li>
                                    <kbd>"S"</kbd>
                                    " - Toggle detailed stats"
                                </li>
                                <li>
                                    <kbd>"E"</kbd>
                                    " - Toggle energy management"
                                </li>
                                <li>
                                    <kbd>"D"</kbd>
                                    " - Toggle drone deployment"
                                </li>
                                <li>
                                    <kbd>"L"</kbd>
                                    " - Toggle event log"
                                </li>
                                <li>
                                    <kbd>"T"</kbd>
                                    " - Toggle token store"
                                </li>
                                <li>
                                    <kbd>"F"</kbd>
                                    " - Toggle research panel"
                                </li>
                                <li>
                                    <kbd>"G"</kbd>
                                    " - Toggle synergy indicator"
                                </li>
                                <li>
                                    <kbd>"X"</kbd>
                                    " - Toggle auto-targeting"
                                </li>
                                <li>
                                    <kbd>"H"</kbd>
                                    " - Toggle this help"
                                </li>
                            </ul>
                        </div>

                        <div class="help-section">
                            <h3>"Objectives"</h3>
                            <p>"Defend the mothership (center) from incoming drone threats"</p>
                            <p>"Manage energy and cooling resources"</p>
                            <p>"Survive progressive waves with increasing difficulty"</p>
                        </div>

                        <div class="help-section">
                            <h3>"Threat Types"</h3>
                            <ul>
                                <li>
                                    <span style="color: #ff6666">"●"</span>
                                    " Commercial - Basic threat"
                                </li>
                                <li>
                                    <span style="color: #ff3333">"●"</span>
                                    " Military - Armored, high health"
                                </li>
                                <li>
                                    <span style="color: #ffaa33">"●"</span>
                                    " Swarm - Fast, coordinated"
                                </li>
                                <li>
                                    <span style="color: #9933ff">"●"</span>
                                    " Stealth - Hard to detect"
                                </li>
                                <li>
                                    <span style="color: #ff0000">"●"</span>
                                    " Kamikaze - Fast, high damage"
                                </li>
                            </ul>
                        </div>

                        <button class="control-button" on:click=move |_| set_show_help.set(false)>
                            "CLOSE"
                        </button>
                    </div>
                </div>
            </Show>
        </div>
    }
}

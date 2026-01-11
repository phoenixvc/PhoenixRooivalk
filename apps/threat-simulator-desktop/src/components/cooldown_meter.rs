use leptos::prelude::*;

// Note: Props are used via Leptos view! macro, compiler doesn't detect this
#[allow(dead_code)]
#[component]
pub fn CooldownMeter(
    current: ReadSignal<f32>,
    max: ReadSignal<f32>,
    label: &'static str,
) -> impl IntoView {
    let percentage = move || {
        let curr = current.get();
        let mx = max.get();
        if mx > 0.0 {
            ((curr / mx) * 100.0).clamp(0.0, 100.0)
        } else {
            0.0
        }
    };

    let is_ready = move || current.get() <= 0.0;

    view! {
        <div class="cooldown-meter">
            <div class="cooldown-header">
                <span class="cooldown-label">{label}</span>
                    <span class="cooldown-value">
                        {move || {
                            if is_ready() {
                                "READY".to_string()
                            } else {
                                format!("{:.1}s", current.get())
                            }
                        }}

                    </span>
            </div>
            <div class="cooldown-bar-container">
                <div
                    class=move || {
                        if is_ready() { "cooldown-bar ready" } else { "cooldown-bar charging" }
                    }

                    style:width=move || format!("{}%", (100.0 - percentage()).clamp(0.0, 100.0))
                ></div>
            </div>
        </div>
    }
}

#[allow(dead_code)]
#[component]
pub fn WeaponCooldownGrid(weapons: ReadSignal<Vec<crate::game::Weapon>>) -> impl IntoView {
    view! {
        <div class="weapon-cooldown-grid">
            {move || {
                weapons
                    .get()
                    .into_iter()
                    .map(|weapon| {
                        let label = format!("{:?}", weapon.weapon_type);
                        let cooldown = weapon.cooldown;
                        let max_cooldown = weapon.max_cooldown;
                        view! {
                            <div class="weapon-cooldown-item">
                                <div class="weapon-name-small">{label}</div>
                                <div class="cooldown-progress">
                                    <div
                                        class="cooldown-fill"
                                        style:width=move || {
                                            let pct = if max_cooldown > 0.0 {
                                                ((cooldown / max_cooldown) * 100.0).clamp(0.0, 100.0)
                                            } else {
                                                0.0
                                            };
                                            format!("{}%", pct)
                                        }

                                        style:background-color=move || {
                                            if cooldown <= 0.0 { "#00ff00" } else { "#ff6600" }
                                        }
                                    ></div>
                                </div>
                            </div>
                        }
                    })
                    .collect_view()
            }}

        </div>
    }
}

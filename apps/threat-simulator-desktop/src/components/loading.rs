use leptos::prelude::*;

#[component]
pub fn LoadingIndicator(progress: ReadSignal<u8>) -> impl IntoView {
    view! {
        <div class="loading-container">
            <div class="loading-content">
                <div class="loading-logo">
                    <div class="phoenix-logo">
                        <div class="phoenix-wing left"></div>
                        <div class="phoenix-body"></div>
                        <div class="phoenix-wing right"></div>
                    </div>
                </div>

                <h1 class="loading-title">"Phoenix Rooivalk"</h1>
                <h2 class="loading-subtitle">"Threat Simulator"</h2>

                <div class="loading-progress">
                    <div class="progress-bar">
                        <div
                            class="progress-fill"
                            style:width=move || format!("{}%", progress.get())
                        ></div>
                    </div>
                    <div class="progress-text">
                        {move || format!("{}%", progress.get())}
                    </div>
                </div>

                <div class="loading-status">
                    <span class="loading-dots">"Loading"</span>
                    <span class="dots">"..."</span>
                </div>
            </div>
        </div>
    }
}

#[component]
pub fn LoadingSpinner() -> impl IntoView {
    view! {
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    }
}

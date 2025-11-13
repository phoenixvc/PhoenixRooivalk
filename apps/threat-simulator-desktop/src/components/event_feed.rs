use js_sys::Date;
use leptos::prelude::*;

#[derive(Debug, Clone)]
pub struct FeedItem {
    pub timestamp: String,
    pub message: String,
    pub severity: FeedSeverity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FeedSeverity {
    Info,
    Warning,
    Critical,
    Success,
}

impl FeedSeverity {
    pub fn to_class(&self) -> &'static str {
        match self {
            FeedSeverity::Info => "feed-item-info",
            FeedSeverity::Warning => "feed-item-warning",
            FeedSeverity::Critical => "feed-item-critical",
            FeedSeverity::Success => "feed-item-success",
        }
    }
}

#[component]
pub fn EventFeed(feed_items: ReadSignal<Vec<FeedItem>>) -> impl IntoView {
    view! {
        <div class="event-feed">
            <div class="feed-header">"EVENT LOG"</div>
            <div class="feed-content">
                <Show
                    when=move || feed_items.get().is_empty()
                    fallback=move || {
                        view! {
                            <For
                                each=move || {
                                    feed_items.get().into_iter().rev().take(10).collect::<Vec<_>>()
                                }

                                key=|item| item.timestamp.clone()
                                children=move |item: FeedItem| {
                                    view! {
                                        <div class=format!("feed-item {}", item.severity.to_class())>
                                            <span class="feed-timestamp">{item.timestamp}</span>
                                            <span class="feed-message">{item.message}</span>
                                        </div>
                                    }
                                }
                            />
                        }
                    }
                >

                    <div class="feed-item feed-item-info">
                        <span class="feed-timestamp">"00:00:00"</span>
                        <span class="feed-message">"System initialized. Awaiting events."</span>
                    </div>
                </Show>
            </div>
        </div>
    }
}

/// Helper to create a feed item with current timestamp
pub fn create_feed_item(message: String, severity: FeedSeverity) -> FeedItem {
    // Use JavaScript Date for WASM compatibility
    let now = Date::new_0();
    let hours = now.get_hours() as u64;
    let minutes = now.get_minutes() as u64;
    let seconds = now.get_seconds() as u64;

    FeedItem {
        timestamp: format!("{:02}:{:02}:{:02}", hours, minutes, seconds),
        message,
        severity,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_feed_item_creation() {
        let item = create_feed_item("Test message".to_string(), FeedSeverity::Info);

        assert!(!item.timestamp.is_empty());
        assert_eq!(item.message, "Test message");
        assert_eq!(item.severity, FeedSeverity::Info);
    }

    #[test]
    fn test_severity_classes() {
        assert_eq!(FeedSeverity::Info.to_class(), "feed-item-info");
        assert_eq!(FeedSeverity::Warning.to_class(), "feed-item-warning");
        assert_eq!(FeedSeverity::Critical.to_class(), "feed-item-critical");
        assert_eq!(FeedSeverity::Success.to_class(), "feed-item-success");
    }
}

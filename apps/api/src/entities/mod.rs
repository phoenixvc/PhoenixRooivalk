/// Entity models for the domain layer
/// These represent the core business objects independent of storage implementation

pub mod user;
pub mod session;
pub mod evidence;
pub mod application;

pub use user::User;
pub use session::Session;
pub use evidence::Evidence;
pub use application::CareerApplication;

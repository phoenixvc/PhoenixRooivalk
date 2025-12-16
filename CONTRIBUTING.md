# Contributing to PhoenixRooivalk

Thank you for considering contributing to the PhoenixRooivalk project! We
welcome contributions from everyone. Here are some guidelines to help you get
started.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with the following
information:

- A clear and descriptive title.
- A description of the steps to reproduce the bug.
- Any relevant screenshots or error messages.
- Your environment (operating system, browser, etc.).

### Feature Requests

We welcome new ideas and feature requests. If you have an idea for a new
feature, please create an issue on GitHub with the following information:

- A clear and descriptive title.
- A detailed description of the feature and how it would benefit the project.
- Any relevant examples or mockups.

### Code Contributions

If you would like to contribute code to the project, follow these steps:

1. **Fork the repository**: Click the "Fork" button at the top of the repository
   page to create a copy of the repository in your GitHub account.

2. **Clone the repository**: Clone your forked repository to your local machine.

   ```sh
   git clone https://github.com/yourusername/PhoenixRooivalk.git
   cd PhoenixRooivalk
   ```

3. **Create a branch**: Create a new branch for your contribution.

   ```sh
   git checkout -b my-feature-branch
   ```

4. **Make your changes**: Make your changes to the codebase.

5. **Commit your changes**: Commit your changes with a descriptive commit
   message.

   ```sh
   git add .
   git commit -m "Add new feature"
   ```

6. **Push your changes**: Push your changes to your forked repository.

   ```sh
   git push origin my-feature-branch
   ```

7. **Create a pull request**: Go to the original repository on GitHub and create
   a pull request from your forked repository.

### Code Style

Please ensure your code adheres to the following style guidelines:

- Use consistent indentation (e.g., 2 spaces for JavaScript, 4 spaces for
  Python).
- Write clear, descriptive comments where necessary.
- Ensure your code is well-documented and easy to read.

### CSS Layout Standards

#### Container Width Guidelines

The project uses two canonical width standards:

| Context | Max Width | Side Padding | Use Case |
|---------|-----------|--------------|----------|
| **General containers** | `1440px` (`--pr-container-max`) | `5%` | Marketing pages, dashboards, wide layouts |
| **Documentation content** | `850px` (`--pr-content-width`) | `5%` | Long-form reading content (docs, articles) |

#### Documentation Width Exception

Documentation pages intentionally use a narrower `850px` max-width instead of
the standard `1440px`. This is because:

1. **Optimal line length**: 50-75 characters per line is ideal for readability
2. **Reduced eye strain**: Shorter lines reduce horizontal eye movement
3. **Better comprehension**: Studies show narrower text columns improve reading
   comprehension

#### Responsive Breakpoints

All layouts should follow mobile-first responsive design:

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | `<600px` | Small phones, full-width content |
| Tablet | `600px - 899px` | Tablets, intermediate width |
| Desktop | `≥900px` | Full content width applies |

#### CSS Variables Reference

```css
/* General containers */
--pr-container-max: 1440px;

/* Documentation-specific */
--pr-content-width: 850px;
--pr-content-padding: 5%;
```

When creating new layouts, use these variables rather than hard-coded values to
maintain consistency across the project.

## Code of Conduct

Please note that this project is governed by a Code of Conduct. By
participating, you are expected to adhere to this code.

## Contact

If you have any questions or need further assistance, please contact:

**Jurie Smit**  
**PhoenixVC**  
**<smit.jurie@gmail.com>**

# UI Coding Standards

## Component Standards

### ONLY shadcn/ui Components
- **ABSOLUTELY NO custom components should be created**
- Use ONLY shadcn/ui components for all UI elements
- All components must come from the shadcn/ui library
- No exceptions to this rule

## Date Formatting Standards

### Library
- Use `date-fns` for all date formatting operations

### Format Specification
Dates must be formatted using ordinal indicators as follows:
- 1st Sep 2025
- 2nd Aug 2025
- 3rd Jan 2026
- 4th Jun 2024

### Format Pattern
- Day with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
- Abbreviated month name (3 letters)
- Full year (4 digits)
# Agent Team Notes

This project is small enough for direct implementation most of the time.

Use independent agents only when the work can be cleanly split, for example:

- one agent reviews scanner privacy behavior;
- one agent reviews UI accessibility/responsive behavior;
- one agent reviews docs and launch copy.

The parent agent remains responsible for integration, validation, and making
sure no real local skill data is committed.


# Monthly Weather Wheel

This is a standalone webpage for logging a 31-day weather report in a two-ring circular grid.

## What it does

- 31 consecutive days starting from the chosen date
- 24 time slices per day: inner ring is 12am-11am, outer ring is 12pm-11pm
- Weather palette: Fair, Cloudy, Rainshower, Heavy rains, Stormy
- The start date automatically sets the day number in each wheel center
- Left-click a slice to paint it with the active weather
- Right-click or Alt-click a slice to erase it
- Saves automatically to `localStorage`
- Exports PNG, PDF, and JSON
- Imports JSON

## Files

- `index.html`
- `styles.css`
- `app.js`

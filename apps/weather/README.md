# Monthly Weather Wheel

This is a standalone webpage for logging a 35-day weather report in a two-ring circular grid.

## What it does

- 35 consecutive days starting from the chosen date
- 24 time slices per day: inner ring is 12am-11am, outer ring is 12pm-11pm
- Weather palette: Fair, Cloudy, Rainshower, Heavy rains, Stormy
- The start date automatically sets the day number in each wheel center
- Left-click a slice to paint it with the active weather
- Right-click or Alt-click a slice to erase it
- Rows and columns are set independently (1-35 each); spare cells stay blank, and days that do not fit continue in extra rows
- Saves automatically to `localStorage`
- Exports PNG, PDF, and JSON
- Imports JSON

## Files

- `index.html`
- `styles.css`
- `app.js`

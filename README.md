# Reflex

Reflex is a lightweight delivery coordination dashboard for shops, dispatchers, and riders.

## Features

- Dispatcher dashboard for open requests, delivery activity, and rider workload
- Delivery creation, rider assignment, status tracking, and confirmation codes
- Retailer view for tracking recent deliveries and creating requests
- Rider view for assigned deliveries and pickup or delivery updates
- Rider management from Settings, including add and delete actions
- CSV export for delivery records
- Local demo data persistence with `localStorage`

## Run Locally

No installation or build step is required. Start a local static server from this folder:

```powershell
python -m http.server 8001
```

Open [http://localhost:8001](http://localhost:8001) in your browser.

You can also open `index.html` directly, but a local server is recommended.

## Publish on Render

This is a static site, so it can be deployed directly on Render:

1. Push the repository to GitHub or GitLab.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render will detect `render.yaml` and create the static site automatically.

The app has no build command. Its data is stored in each visitor's browser using
`localStorage`, so it does not provide shared server-side data.

## Role Views

Use the role switcher in the top bar:

- **Dispatcher**: Manage deliveries, riders, activity, workspaces, and settings.
- **Retailer**: Track deliveries and create new delivery requests.
- **Rider**: View assigned deliveries and update pickup or delivery status.

## Demo Workflow

1. Select **Dispatcher** and open **Deliveries**.
2. Create a request with **New delivery** or assign the existing open request.
3. Switch to **Rider** and update the assigned delivery.
4. Confirm delivery with the confirmation code shown in the tracking view.
5. Switch to **Retailer** to view delivery progress.

## Project Structure

- `index.html` - Application markup and shell
- `styles.css` - Visual styles and responsive layout
- `app.js` - Rendering, state, interactions, and local persistence

## Data

This is a browser-based demo. Deliveries and riders are saved in `localStorage` for the current browser profile. Use **Settings > Reset demo data** to restore the original sample data.

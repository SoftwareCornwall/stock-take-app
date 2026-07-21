# Stock Take Mobile Web App

A mobile-first web application for conducting annual equipment stock takes with minimal typing and fast interaction.

## Features

- Mobile-first design optimized for phones and tablets
- Fast interaction with tap and count, minimal keyboard input
- CSV export to generate reports by department
- Shared login with single set of credentials for team
- Local storage so data persists in browser
- Department management organized by super and sub-departments
- Optional serial number tracking for items
- Session completion to lock sessions when done

## Quick Start

### Use Locally

1. Clone this repository
2. Open `Stock Taking App/index.html` in a web browser
3. Login with demo credentials:
   - Username: `staff`
   - Password: `stocktake`

### Deploy to GitHub Pages

1. Go to repository Settings > Pages
2. Under "Source", select `main` branch and `/Stock Taking App` folder
3. Click Save
4. Your app will be live at `https://yourusername.github.io/stock-take-app`

### Deploy to Vercel

1. Create a `vercel.json` in the root:
   ```json
   {
     "public": "Stock Taking App"
   }
   ```
2. From the repo root: `vercel`
3. Your app will be live instantly with a public URL

### Deploy to Netlify

1. Drag the `Stock Taking App` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repo and set the publish directory to `Stock Taking App`

## Usage

1. Select Department - Choose Tech Cornwall or Agile on the Beach
2. Add Sub Department - Create or select a sub department
3. Create Session - Start a new session with an optional note
4. Count Items - Tap items to open the detail view
5. Update Quantity - Use +/- buttons to count
6. Set Condition - Mark items as New, Good, Fair, Damaged, or Other
7. Add Serial Numbers - If tracking serial items
8. Confirm - Press "Confirm update" to save changes
9. Complete Session - Lock session when done
10. Export CSV - Generate separate files for serial and standard items

## Default Credentials

- Username: `staff`
- Password: `stocktake`

These can be changed in the app's Configuration panel.

## Data Storage

All data is stored locally in your browser using localStorage.

- Data persists between sessions
- Works offline
- Not synced across devices
- Clearing browser data will delete everything

Regularly export sessions to CSV to preserve records.

## Technical Details

### Stack
- Language: Vanilla JavaScript (no build tools needed)
- Styling: Plain CSS with CSS variables
- Storage: Browser localStorage
- No external dependencies

### File Structure
```
Stock Taking App/
├── index.html           Main HTML entry point
├── styles.css           All styling
├── app-epics3-11.js     Complete application logic
└── app-epics1-2.js      Previous version (reference)
```

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Change Default Credentials

Edit `DEFAULT_CREDENTIALS` in `app-epics3-11.js`:
```javascript
const DEFAULT_CREDENTIALS = {
  username: 'staff',
  password: 'stocktake'
};
```

### Modify Departments

Edit `SUPER_DEPARTMENTS` in `app-epics3-11.js`:
```javascript
const SUPER_DEPARTMENTS = ['Tech Cornwall', 'Agile on the Beach'];
```

### Modify Default Catalogue

Edit `DEFAULT_CATALOGUE` in `app-epics3-11.js` to change the default items:
```javascript
const DEFAULT_CATALOGUE = [
  { id: 'cat-laptop', name: 'Laptop', category: 'Computing', serialTracked: true },
  // ... more items
];
```

## Troubleshooting

### App won't load
- Check browser console (F12) for errors
- Clear browser cache and reload
- Try a different browser

### Data disappeared
- Browser storage was cleared
- Try a different browser profile
- Check if you're in private/incognito mode

### Export not working
- Check browser permissions for downloads
- Ensure pop-ups aren't blocked
- Try a different browser

## Support

For issues or feature requests, open an issue on GitHub or contact the development team.

## License

Internal use only.

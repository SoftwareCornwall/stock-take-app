# Stock Take Mobile Web App

A mobile-first web application for conducting annual equipment stock takes with minimal typing and fast interaction.

## Features

- 📱 **Mobile-first design** – optimized for phones and tablets
- 🚀 **Fast interaction** – tap & count with minimal keyboard input
- 📊 **CSV export** – generate reports by department
- 🔐 **Shared login** – single set of credentials for team
- 💾 **Local storage** – data persists in browser
- 📋 **Department management** – organize by super and sub-departments
- 🏷️ **Serial tracking** – optional item serial numbers
- ✅ **Session completion** – lock sessions when done, archive later

## Quick Start

### Option 1: Use the Static Files Directly

1. Download or clone this repository
2. Open `Stock Taking App/index.html` in a web browser
3. Login with demo credentials:
   - **Username**: `staff`
   - **Password**: `stocktake`

### Option 2: Deploy to GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Source", select `main` branch and `/Stock Taking App` folder
3. Click Save
4. Your app will be live at `https://yourusername.github.io/stock-take-app`

### Option 3: Deploy to Vercel (Recommended)

1. Install [Vercel CLI](https://vercel.com/download) or connect via GitHub
2. Create a `vercel.json` in the root:
   ```json
   {
     "public": "Stock Taking App"
   }
   ```
3. From the repo root: `vercel`
4. Your app will be live instantly with a public URL

### Option 4: Deploy to Netlify

1. Drag the `Stock Taking App` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repo and set the publish directory to `Stock Taking App`
3. Get a live URL with automatic updates

## Usage

### Starting a Stock Take

1. **Select Department** – Choose a super department (Tech Cornwall or Agile on the Beach)
2. **Add Sub Department** – Create or select a sub department
3. **Create Session** – Start a new session with an optional note
4. **Count Items** – Tap items to open detail view
5. **Update Quantity** – Use +/− buttons to count
6. **Set Condition** – Mark items as New, Good, Fair, Damaged, or Other
7. **Serial Numbers** – Add if tracking serial items
8. **Confirm & Save** – Press "Confirm update" to save changes

### Completing & Exporting

- **Complete Session** – Lock session when done (prevents further edits)
- **Archive Session** – Move completed sessions to archive
- **Export CSV** – Generate separate files for serial and standard items
- **View History** – Switch between Active, Completed, and Archived views

## Default Credentials

- **Username**: `staff`
- **Password**: `stocktake`

These can be changed in the app's Configuration panel.

## Data Storage

All data is stored locally in your browser using `localStorage`. This means:

- ✅ Data persists between sessions
- ✅ Works offline
- ❌ Not synced across devices
- ❌ Clearing browser data will delete everything

**Backup your data**: Export sessions to CSV regularly to preserve records.

## Technical Details

### Technology Stack
- **Language**: Vanilla JavaScript (no build tools needed)
- **Styling**: Plain CSS with CSS variables
- **Storage**: Browser localStorage
- **No dependencies**: Runs entirely in the browser

### File Structure
```
Stock Taking App/
├── index.html           # Main HTML entry point
├── styles.css           # All styling
├── app-epics3-11.js     # Complete application logic
└── app-epics1-2.js      # Previous version (reference)
```

### Browser Support
Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Change Default Credentials

Edit the `DEFAULT_CREDENTIALS` in `app-epics3-11.js`:
```javascript
const DEFAULT_CREDENTIALS = {
  username: 'staff',
  password: 'stocktake'
};
```

Then change via the app's Configuration panel, or directly:
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

## Future Enhancements

See `Stock Taking App/developer_handoff.md` for product roadmap. Potential additions:
- Backend sync for multi-device use
- Barcode scanning
- Offline mode
- Role-based permissions
- Audit logging

## Support & Feedback

For issues or feature requests, open an issue on GitHub or contact the development team.

## License

Internal use only.

---

**Last updated**: July 2026

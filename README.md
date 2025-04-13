# Campus Lost & Found Web Application

A fully responsive, secure, and real-time web portal where students can report, search, claim, and manage lost or found items on campus.

## 🧱 Tech Stack

- **Frontend**: React.js + JSX
- **Backend/Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google & Email Login)
- **File Storage**: Firebase Cloud Storage
- **Styling**: Tailwind CSS
- **Notifications**: EmailJS integration

## 🔧 Core Functionalities

1. **Authentication System**

   - Google Sign-in via Firebase
   - Email/Password authentication
   - Role detection (admin vs regular user)
   - User profiles stored in Firestore

2. **Item Reporting**

   - Found Item Form: Title, Description, Image, Found Location, Date
   - Lost Item Form: Title, Description, Location Last Seen, Reward (optional)

3. **Dynamic Item Feed**

   - Search and filter by category, date range, location
   - Responsive grid layout
   - Infinite scroll pagination

4. **Matching Algorithm**

   - String similarity (Levenshtein distance)
   - Category, date, and location matching
   - Match scoring system

5. **Item Claim Process**
   - Claim request forms
   - Admin review system
   - Status tracking (available, claimed, approved, rejected)

## 📝 Project Structure

```
src/
  ├── components/        # Reusable UI components
  │   ├── FoundItemForm.js
  │   ├── ItemCard.js
  │   ├── LostItemForm.js
  │   └── Navbar.js
  ├── contexts/          # React context providers
  │   └── AuthContext.js
  ├── firebase/          # Firebase configuration
  │   └── config.js
  ├── pages/             # Page components
  │   ├── FoundItems.js
  │   ├── Login.js
  │   ├── LostItems.js
  │   └── SignUp.js
  ├── utils/             # Utility functions
  │   └── matching.js
  ├── App.js             # Main application component
  └── index.js           # Entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase account and project setup

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/campus-lost-found.git
   cd campus-lost-found
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Firebase configuration:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Storage
   - Update the `src/firebase/config.js` file with your Firebase credentials

4. Start the development server:
   ```bash
   npm start
   ```

## 🔒 Security Rules

Remember to set up proper security rules in your Firebase console for Firestore and Storage to ensure data safety.

Example Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read and create items
    match /found_items/{item} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.foundBy.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    match /lost_items/{item} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.lostBy.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 Responsive Design

The application is fully responsive and works on devices of all sizes, from mobile phones to large desktop screens.

## 🌟 Future Enhancements

- Implement real-time notifications using Firebase Cloud Messaging
- Add image recognition for better item matching using Google Cloud Vision API
- Create a mobile app version using React Native
- Implement a chat feature for direct communication between item finders and owners

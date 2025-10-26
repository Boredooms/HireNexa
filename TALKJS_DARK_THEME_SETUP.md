# 🎨 TalkJS Dark Theme Setup Guide

## ⚠️ IMPORTANT: TalkJS themes MUST be configured in the TalkJS Dashboard

TalkJS runs in an iframe and cannot be styled with regular CSS. You MUST configure the theme in the TalkJS dashboard.

---

## 📋 Step-by-Step Instructions

### Step 1: Access TalkJS Dashboard

1. Go to: **https://talkjs.com/dashboard**
2. Login with your account credentials
3. Select your app: **tyhpElWZ** (your app ID)

### Step 2: Navigate to Themes

1. Click on **"Settings"** in the left sidebar
2. Click on **"Themes"**
3. You'll see the theme editor

### Step 3: Edit Default Theme (or Create New)

**Option A: Edit Default Theme**
1. Click on the **"default"** theme
2. Click **"Edit"**

**Option B: Create New Theme**
1. Click **"Create Theme"**
2. Name it: **"dark"** or **"HireNexa Dark"**

### Step 4: Configure Theme Colors

In the theme editor, set these values:

#### **Background Colors:**
```
Background Color: #0f0f1e
Header Background: #1a1a2e
Message Field Background: #1a1a2e
```

#### **Text Colors:**
```
Text Color: #ffffff
Header Text Color: #ffffff
Placeholder Text: #9ca3af
Timestamp Color: #9ca3af
```

#### **Message Bubbles:**
```
Sent Message Background: #3B82F6
Sent Message Text: #ffffff
Received Message Background: #1a1a2e
Received Message Text: #ffffff
```

#### **Accent & Buttons:**
```
Accent Color: #3B82F6
Button Background: #3B82F6
Button Text: #ffffff
Link Color: #3B82F6
```

#### **Borders:**
```
Border Color: rgba(255, 255, 255, 0.2)
Input Border: rgba(255, 255, 255, 0.2)
```

### Step 5: Advanced Customization (Optional)

Click on **"Custom CSS"** tab and add:

```css
/* Dark theme enhancements */
body {
  background-color: #0f0f1e !important;
}

.chatbox-header {
  background-color: #1a1a2e !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.message-field {
  background-color: #1a1a2e !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.message-field-input {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.message-field-input::placeholder {
  color: #9ca3af !important;
}

.send-button {
  background-color: #3B82F6 !important;
}

.message-bubble.sent {
  background-color: #3B82F6 !important;
  color: #ffffff !important;
}

.message-bubble.received {
  background-color: #1a1a2e !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.timestamp {
  color: #9ca3af !important;
}

.conversation-list {
  background-color: #0f0f1e !important;
}

.conversation-list-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.conversation-list-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
```

### Step 6: Save and Publish

1. Click **"Save"** button
2. Click **"Publish"** to make it live
3. If you created a new theme, set it as **default** OR update the code

### Step 7: Update Code (if using custom theme name)

If you named your theme something other than "default", update the code:

```typescript
const chatbox = session.createChatbox({
  theme: 'dark' // or 'HireNexa Dark' - whatever you named it
})
```

---

## 🔍 Verification

After setting up the theme:

1. Refresh your HireNexa app
2. Go to Skill Exchange → Chat
3. The chat should now have a dark theme!

---

## 📸 Expected Result

- **Background**: Dark blue-black (#0f0f1e)
- **Header**: Darker shade (#1a1a2e)
- **Your messages**: Blue bubbles (#3B82F6)
- **Their messages**: Dark gray bubbles (#1a1a2e)
- **Input field**: Dark with white text
- **Send button**: Blue (#3B82F6)

---

## 🆘 Troubleshooting

### Theme not applying?
1. Make sure you clicked "Publish" after saving
2. Clear browser cache and refresh
3. Check that the theme name in code matches dashboard

### Still showing white?
1. Verify you're logged into the correct TalkJS account
2. Check that you're editing the correct app (tyhpElWZ)
3. Make sure "default" theme is the one you edited

### Can't access dashboard?
1. Check your TalkJS account email
2. Reset password if needed
3. Contact TalkJS support: support@talkjs.com

---

## 📚 Resources

- TalkJS Themes Documentation: https://talkjs.com/docs/Features/Themes/
- TalkJS Dashboard: https://talkjs.com/dashboard
- Your App ID: `tyhpElWZ`

---

**Note**: TalkJS themes are server-side and cannot be overridden with client-side CSS due to iframe security. The dashboard is the ONLY way to properly theme TalkJS.

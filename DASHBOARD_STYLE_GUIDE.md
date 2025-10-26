# HireNexa Dashboard Style Guide

## Color Scheme
- **Primary Blue**: `#3B82F6`
- **Light Blue**: `#60A5FA`
- **Dark Blue**: `#2563EB`
- **Background**: `black` with gradient `from-black via-[#0f0f1e] to-black`
- **Text**: `white` / `gray-300` / `gray-400`

## Common Classes

### Backgrounds
```
// Main page background
bg-gradient-to-br from-black via-[#0f0f1e] to-black

// Glassmorphism cards
bg-white/5 backdrop-blur-sm border border-white/10

// Hover state
hover:bg-white/10 hover:border-[#3B82F6]/50
```

### Buttons
```
// Primary button
bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white border-[#3B82F6]

// Secondary button
bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10

// Active state
bg-gradient-to-r from-[#3B82F6] to-[#2563EB] border-[#3B82F6] text-white
```

### Text
```
// Headings
text-white font-bold

// Gradient text
bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent

// Secondary text
text-gray-300 / text-gray-400
```

### Cards/Containers
```
// Standard card
bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all

// With group hover
group hover:bg-white/10 hover:border-[#3B82F6]/50
```

### Sidebar/Navigation
```
// Sidebar background
bg-black/40 backdrop-blur-md border-r border-white/10

// Nav item active
bg-gradient-to-r from-[#3B82F6] to-[#2563EB] border-[#3B82F6] text-white

// Nav item inactive
bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-[#3B82F6]/50
```

## Animation Classes
```
// Hover scale
group-hover:scale-110 transition-transform

// Smooth transitions
transition-all
hover:shadow-lg hover:shadow-[#3B82F6]/50
```

## Layout Structure

### Page Template
```tsx
<div className="w-full min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
  {/* Sidebar */}
  <aside className="fixed left-0 top-0 w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 h-screen overflow-y-auto z-40">
    {/* Navigation items */}
  </aside>

  {/* Main content */}
  <main className="ml-64 p-8">
    {/* Page content */}
  </main>
</div>
```

### Card Component
```tsx
<div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
  {/* Card content */}
</div>
```

## Implementation Steps for Each Dashboard Page

1. **Update background**: Change to `bg-gradient-to-br from-black via-[#0f0f1e] to-black`
2. **Update text colors**: Change black text to white, gray-600 to gray-400
3. **Update borders**: Change `border-black` to `border-white/10` or `border-white/20`
4. **Update buttons**: Apply blue gradient and glassmorphism
5. **Update cards**: Apply `bg-white/5 backdrop-blur-sm` pattern
6. **Add hover effects**: Include `hover:bg-white/10 hover:border-[#3B82F6]/50`
7. **Replace emoji icons**: Use lucide-react icons where possible

## Files to Update

### Priority 1 (Core Navigation)
- ✅ `/src/components/DashboardNav.tsx` - Updated
- ✅ `/src/app/dashboard/page.tsx` - Updated (partially)

### Priority 2 (Main Dashboard Pages)
- `/src/app/dashboard/portfolio/page.tsx`
- `/src/app/dashboard/github/page.tsx`
- `/src/app/dashboard/nft/page.tsx`
- `/src/app/dashboard/assignments/page.tsx`

### Priority 3 (Secondary Pages)
- `/src/app/dashboard/skills/page.tsx`
- `/src/app/dashboard/certificates/page.tsx`
- `/src/app/dashboard/peer-review/page.tsx`
- `/src/app/dashboard/recruiter/page.tsx`
- `/src/app/dashboard/celo/page.tsx`

### Priority 4 (Specialized Pages)
- `/src/app/dashboard/skill-exchange/page.tsx`
- `/src/app/dashboard/admin/page.tsx`
- All sub-pages under each section

## Lucide React Icons to Use

Replace emojis with these icons:
- 🔗 → `<Github />`
- 📦 → `<Package />`
- 🎨 → `<Zap />`
- 📋 → `<BookOpen />`
- 🏆 → `<Trophy />`
- 🔄 → `<RefreshCw />`
- ✨ → `<Sparkles />`
- ⛓️ → `<Shield />`
- 👥 → `<Users />`
- 💼 → `<Briefcase />`
- 🛡️ → `<Lock />`

## Example: Converting a Dashboard Page

### Before
```tsx
<div className="bg-white">
  <h1 className="text-black">Portfolio</h1>
  <button className="bg-[#35D07F] text-black">Generate</button>
  <div className="bg-gray-100 border-2 border-black">
    {/* content */}
  </div>
</div>
```

### After
```tsx
<div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
  <h1 className="text-white font-bold">Portfolio</h1>
  <button className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg px-6 py-3 hover:shadow-lg hover:shadow-[#3B82F6]/50">Generate</button>
  <div className="bg-white/5 border border-white/20 rounded-xl p-8 backdrop-blur-sm hover:bg-white/10">
    {/* content */}
  </div>
</div>
```

## Notes
- All pages should use the blue color scheme (#3B82F6, #60A5FA, #2563EB)
- Maintain glassmorphism effect with `backdrop-blur-sm` and `bg-white/5`
- Use smooth transitions and hover effects for better UX
- Keep the dark theme consistent across all pages
- Update navigation items to use lucide-react icons

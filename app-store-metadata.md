# Frostbite — App Store Metadata

## App Name
Frostbite

## Subtitle (30 chars max)
Chop. Collect. Survive.

## Category
Games › Action

## Age Rating
4+ (no violence, no in-app purchases, no user-generated content)

---

## Description (4000 chars max)

Survive the frozen wilderness in this satisfying idle-action game.

Your character roams a snowy landscape while axes orbit around them automatically — chopping trees, fighting bears, and collecting everything in sight. Drag your finger to move. Everything else takes care of itself.

**Chop & Collect**
Walk into trees and watch your axes do the work. Wood flies to you in satisfying arcs. Stack it up and spend it on upgrades that make your axes hit harder, orbit faster, and multiply.

**Explore New Zones**
The world expands as you grow. Collect enough wood to unlock Bear Territory — where dark brown bears wander and drop meat. Keep pushing to reach the Rocky Tundra, where stone deposits reward the dedicated survivor.

**Upgrade & Progress**
Open the shop to spend your resources on permanent upgrades:
- Extra axes orbiting at once
- Faster orbit speed
- Longer orbit radius
- Movement speed
- And more

**Feel Good to Play**
Every hit has crunch. Every kill has weight. Snow drifts down. Resources bounce and arc toward you with satisfying physics. Floating damage numbers keep you informed.

Simple to pick up. Surprisingly deep to master.

---

## Keywords (100 chars max)
idle,survival,axe,chop,wood,collect,upgrade,isometric,snow,casual,action,bear,tundra,forest

---

## Support URL
https://github.com/keyspress/kace-game

## Marketing URL
https://github.com/keyspress/kace-game

---

## What's New (Version 1.0)
Initial release. Chop trees in the Pine Forest, unlock Bear Territory and Rocky Tundra, and upgrade your axes to dominate the wilderness.

---

## App Icon Requirements (provide a single 1024×1024 PNG, no alpha)

Suggested concept: A white/ice-blue axe over a dark snowy background with snowflakes.
Tools: Figma, Canva, or any image editor.

iOS will auto-generate all sizes from your 1024×1024 source in App Store Connect.

Required App Store Connect upload:
- 1024×1024 px PNG, no transparency, no rounded corners (Apple applies rounding)

---

## Screenshots Required

### iPhone 6.9" (iPhone 16 Pro Max — required)
- 1320 × 2868 px portrait  OR  2868 × 1320 px landscape
- Minimum 3 screenshots, maximum 10
- The game is landscape, so use 2868 × 1320

### iPhone 6.5" (iPhone 14 Plus — required)
- 1284 × 2778 px portrait  OR  2778 × 1284 px landscape

### iPad Pro 13" (optional but recommended)
- 2048 × 2732 px portrait  OR  2732 × 2048 px landscape

**Suggested screenshot scenes:**
1. Player surrounded by forest trees, axes orbiting — establishes core gameplay
2. Bear Territory with bears wandering, meat drops flying
3. Upgrade shop open showing several purchased upgrades
4. Rocky Tundra with stone formations and all three resource types in HUD

---

## Privacy Policy

This app:
- Does NOT collect any personal data
- Does NOT use analytics or tracking
- Does NOT require an account
- Saves game progress locally on device only

If App Store Connect requires a Privacy Policy URL, host a simple page stating the above.

---

## TestFlight Notes (for internal testing)

Build and deploy steps (requires Mac with Xcode):

```bash
# 1. Build web assets
cd frostbite
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# In Xcode:
# - Set your Team in Signing & Capabilities
# - Set Bundle ID to com.kace.frostbite
# - Set version to 1.0, build to 1
# - Product → Archive → Distribute → TestFlight
```

**What to test on device:**
- [ ] Drag input responds correctly (proportional speed, invisible anchor)
- [ ] Axes orbit visibly and chop trees on contact
- [ ] Resource drops bounce and arc to player
- [ ] HUD resource counts update immediately
- [ ] Shop opens, game pauses, upgrades purchase correctly
- [ ] Bear Territory notification appears at 500 lifetime wood
- [ ] Screen shake on bear kill feels good at 60fps
- [ ] Snow particles don't cause frame drops
- [ ] Save persists after closing and reopening the app
- [ ] No crashes on iPhone 12 or later

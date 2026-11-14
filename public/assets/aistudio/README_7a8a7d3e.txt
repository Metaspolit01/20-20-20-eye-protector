# 20-20-20 Eye Protector — Lottie starter assets

Included:
- eye_healthy.json — healthy idle eye
- eye_blink.json — short blink cycle
- eye_tired.json — slightly tired expression
- eye_squeeze.json — gradual eyelid squeeze
- eye_overdue.json — red-tinted overdue alert
- eye_recovery.json — transition back to healthy

These are original, editable vector Lottie JSON starter animations (512×512, 30 fps, 4-second loop/timeline).
They are intentionally simple mascot assets, not medical indicators. Redness is a visual reminder only.

Android:
1. Put the JSON files in `app/src/main/assets/`.
2. Add the Lottie Compose dependency:
   `implementation("com.airbnb.android:lottie-compose:<current-version>")`
3. Load with `LottieCompositionSpec.Asset("eye_healthy.json")`.
4. Switch the loaded composition when your screen-on timer changes state.
5. For blinking, play `eye_blink.json` occasionally while the current state is healthy/tired.

Note: these are starter vector animations. Preview them in LottieFiles or an Android Lottie player and adjust styling/timing to your app.

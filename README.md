# Tasks App

A web app for organizing your work into boards of notes, like sticky notes on a wall. Each board holds tasks with a due date, a category and a priority, so you can see at a glance what's pending, what's done and what's coming up. The categories (teaching, research, management, tutoring) make it a good fit for university staff, but it works for any kind of task. The interface is in Spanish.

Try it: https://tasks-app-sable.vercel.app/

## What you can do with it

- **Create boards** for each subject, project or area, give them a color and a group name (for example "Cálculo I" in "Pregrado").
- **Add notes to a board** with a title, an optional description, a due date, a category (Docencia, Investigación, Gestión or Tutorías) and a priority (high, medium or low).
- **Mark notes as done.** Each board shows pending and completed notes separately, and notes past their due date are flagged.
- **See everything on a calendar**: notes with a due date from all your boards, month by month.
- **Browse by category** from the sidebar to see every note of one category, whatever board it's in.
- **Star your favorite boards**, search boards by name, and move boards you don't need to the trash, where you can restore them or delete them for good.
- **Switch between light and dark mode**, and use it on a phone as well as a computer.

## Where the data comes from

There's no preloaded data: everything in the app is what you create. You sign up with your email and a password, and your boards and notes are saved in a Firebase (Google) database linked to your account. They sync automatically, so you see the same boards on any device you sign in from.

Your data is private. The database rules (`firestore.rules`) only let each user read and change their own boards and notes.

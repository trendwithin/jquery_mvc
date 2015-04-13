# Github Issue Tracker with TodoMVC

by Tyler Pottle and Michael Becco

## Description

This project is a simple todo-list-style tracker for github issues, using
the existing architecture of the jQuery implementation of the
[TodoMVC](https://github.com/tastejs/todomvc) project.

## Use

This app is hardcoded to only track issues for my portfolio project for my
Github profile, however this project could be updated to allow a user to enter
their own github profile name and a particular repo with a little extra work.
For now, when I load the page, a prompt appears to enter my secret authorization
token.  Then, the issues from the portfolio project will all appear on the
todo list.  From here, issues can be created, existing issues can be edited and
switched from open to closed.  The list can also be filtered by open issues,
closed issues, or the default of all issues.  We decided to remove the ability
to delete issues because issues aren't designed to be deleted from Github, and
also the ability to toggle issues either open or closed all at once was taken
out, because I didn't see a scenario where I would want to open or close every
issue for my portfolio project all at once.

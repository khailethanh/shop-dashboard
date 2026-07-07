'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (res.locals.user) return res.redirect('/');
  res.render('login', { layout: false, error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.' });
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.render('login', { layout: false, error: 'Invalid email or password.' });
    }
    req.session.regenerate((err) => {
      if (err) return res.render('login', { layout: false, error: 'Login failed. Please try again.' });
      req.session.userId = user.id;
      req.session.save((saveErr) => {
        if (saveErr) return res.render('login', { layout: false, error: 'Login failed.' });
        res.redirect('/');
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { layout: false, error: 'An unexpected error occurred.' });
  }
});

router.get('/signup', (req, res) => {
  if (res.locals.user) return res.redirect('/');
  res.render('signup', { layout: false, error: null });
});

router.post('/signup', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword) {
    return res.render('signup', { layout: false, error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.render('signup', { layout: false, error: 'Passwords do not match.' });
  }
  if (password.length < 8) {
    return res.render('signup', { layout: false, error: 'Password must be at least 8 characters.' });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.render('signup', { layout: false, error: 'An account with that email already exists.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email.trim().toLowerCase(), hash);
    req.session.regenerate((err) => {
      if (err) return res.render('signup', { layout: false, error: 'Signup failed. Please try again.' });
      req.session.userId = result.lastInsertRowid;
      req.session.save((saveErr) => {
        if (saveErr) return res.render('signup', { layout: false, error: 'Signup failed.' });
        res.redirect('/shops/add');
      });
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.render('signup', { layout: false, error: 'An unexpected error occurred.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

router.get('/auth/etsy', (req, res) => {
  res.json({ status: 'oauth_not_implemented' });
});

router.get('/auth/callback', (req, res) => {
  res.json({ status: 'oauth_not_implemented' });
});

module.exports = router;

import cookie from 'cookie';

export default function handler(req, res) {
  try {
    // Parse cookies from the request headers
    const cookies = cookie.parse(req.headers.cookie || '');

    // Get the user's IP address
    const userIP = (req.headers['x-forwarded-for'] || req.connection.remoteAddress)
      .split(',')[0] // Extract the first IP in case of multiple addresses
      .trim(); // Remove any extra spaces

    // Check if the user has a session cookie
    const sessionCookie = cookies.session;

    if (!sessionCookie) {
      // New IP detected, reset session
      res.setHeader(
        'Set-Cookie',
        cookie.serialize('session', userIP, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Enable Secure flag in production
          sameSite: 'strict', // Prevent CSRF attacks
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })
      );
      res.status(200).json({ isNewSession: true });
    } else if (sessionCookie !== userIP) {
      // IP changed, reset session
      res.setHeader(
        'Set-Cookie',
        cookie.serialize('session', userIP, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })
      );
      res.status(200).json({ isNewSession: true });
    } else {
      // Existing session
      res.status(200).json({ isNewSession: false });
    }
  } catch (error) {
    console.error('Error in session handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

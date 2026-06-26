// backend/middleware/validateAuth.js
const { z } = require('zod')

const loginSchema = z.object({
  email:    z.string({ required_error: 'Email is required' })
              .trim()
              .email('Invalid email format'),
  password: z.string({ required_error: 'Password is required' })
              .min(1, 'Password is required'),
  role:     z.enum(['admin', 'promoter', 'sponsor', 'customer']).optional()
}).strict()

const signupSchema = z.object({
  role:          z.enum(['customer', 'sponsor'], {
                   required_error: 'Role is required',
                   invalid_type_error: 'Role must be customer or sponsor'
                 }),
  email:         z.string({ required_error: 'Email is required' })
                   .trim()
                   .email('Invalid email format'),
  password:      z.string({ required_error: 'Password is required' })
                   .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  firstName:     z.string().trim().min(1, 'First name is required').optional(),
  lastName:      z.string().trim().min(1, 'Last name is required').optional(),
  phone:         z.string().trim().optional(),
  companyName:   z.string().trim().optional(),
  industry:      z.string().trim().optional()
}).strict()

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
           .trim()
           .email('Invalid email format')
}).strict()

// Reusable middleware factory
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data',
        errors
      })
    }
    req.body = result.data  // replace with sanitized data
    next()
  }
}

const validateResetPassword = (req, res, next) => {
  const { token, email, newPassword, confirmNewPassword } = req.body || {}
 
  if (!token || typeof token !== 'string' || token.trim().length !== 64) {
    return res.status(400).json({ error: 'Invalid or missing reset token' })
  }
 
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' })
  }
 
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' })
  }
 
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'Passwords do not match' })
  }
 
  next()
}
 
module.exports = {
  validateLogin:          validate(loginSchema),
  validateSignup:         validate(signupSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword,
}
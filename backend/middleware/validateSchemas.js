// backend/middleware/validateSchemas.js
const { z } = require('zod')

// ─── Reusable factory ────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data',
        errors: result.error.flatten().fieldErrors
      })
    }
    req.body = result.data
    next()
  }
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: result.error.flatten().fieldErrors
      })
    }
    req.query = result.data
    next()
  }
}

// ─── Order ───────────────────────────────────────────────────
const createOrderSchema = z.object({
  reservationId: z.string().trim().min(1, 'reservationId is required'),
  amount:        z.number().finite().positive('amount must be greater than 0'),
  paymentMethod: z.enum(['invoice'], {
    required_error: 'paymentMethod is required',
    invalid_type_error: 'paymentMethod must be invoice'
  }),
  notes: z.string().trim().max(500).optional()
}).strict()

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'rejected', 'refunded'], {
    required_error: 'status is required'
  }),
  notes: z.string().trim().max(500).optional()
}).strict()

// ─── Reservation ─────────────────────────────────────────────
const updateReservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'rejected', 'refunded'], {
    required_error: 'status is required',
    invalid_type_error: 'Invalid status value'
  })
}).strict()

const addExhibitorsSchema = z.object({
  userIds: z.array(z.string().trim().min(1)).min(1, 'At least one userId required')
}).strict()

const updateStoreSettingsSchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  industry:    z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional()
}).strict()

// ─── Booth reservation (in eventController) ──────────────────
const reserveBoothSchema = z.object({
  boothId:        z.string().trim().min(1, 'boothId is required'),
  paymentMethod:  z.enum(['invoice']).default('invoice'),
  poNumber:       z.string().trim().max(100).optional(),
  batchId:        z.string().trim().optional(),
  billingAddress: z.object({
    email:       z.string().email().optional(),
    companyName: z.string().trim().max(200).optional()
  }).optional(),
  amount: z.object({
    total:         z.number().finite().nonnegative(),
    subtotal:      z.number().finite().nonnegative(),
    discount:      z.number().finite().nonnegative().optional(),
    discountLabel: z.string().trim().optional().nullable(),
    fee:           z.number().finite().nonnegative().optional(),
    tax:           z.number().finite().nonnegative().optional()
  }).optional(),
  appliedGift: z.string().trim().optional().nullable(),
  giftCode:    z.string().trim().optional()
})

// ─── Buy Seats (in eventController) ─────────────────────────
const buySeatsSchema = z.object({
  seatIds: z.array(z.string().trim().min(1)).min(1, 'At least one seatId required'),
  paymentMethod: z.enum(['invoice']).default('invoice'),
  billingInfo: z.object({
    email:    z.string().email().optional(),
    poNumber: z.string().trim().max(100).optional()
  }).optional(),
  amount: z.object({
    total:         z.number().finite().nonnegative(),
    subtotal:      z.number().finite().nonnegative(),
    discount:      z.number().finite().nonnegative().optional(),
    discountLabel: z.string().trim().optional().nullable(),
    fee:           z.number().finite().nonnegative().optional()
  }).optional(),
  appliedGift: z.string().trim().optional().nullable(),
  giftCode:    z.string().trim().optional()
})

// ─── Payout ──────────────────────────────────────────────────
const createPayoutSchema = z.object({
  amount:        z.number().finite().positive('amount must be greater than 0'),
  method:        z.string().trim().min(1, 'method is required'),
  methodDetails: z.string().trim().optional(),
  reference:     z.string().trim().optional(),
  eventIds:      z.array(z.string().trim().min(1)).optional()
}).strict()

const updatePayoutStatusSchema = z.object({
  status:          z.enum(['pending', 'approved', 'rejected', 'completed']),
  rejectionReason: z.string().trim().max(500).optional()
}).strict()

// ─── Merchandise ─────────────────────────────────────────────
const createMerchandiseSchema = z.object({
  name:        z.string().trim().min(1, 'name is required'),
  description: z.string().trim().optional(),
  price:       z.number().finite().positive('price must be greater than 0'),
  category:    z.string().trim().min(1, 'category is required'),
  stock:       z.number().int().nonnegative().optional(),
  image:       z.string().trim().optional(),
  eventId:     z.string().trim().min(1, 'eventId is required'),
  boothCode:   z.string().trim().optional(),
  status:      z.enum(['active', 'inactive', 'draft']).optional()
}).strict()

const updateMerchandiseSchema = z.object({
  name:        z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  price:       z.number().finite().positive().optional(),
  category:    z.string().trim().optional(),
  stock:       z.number().int().nonnegative().optional(),
  image:       z.string().trim().optional(),
  boothCode:   z.string().trim().optional(),
  status:      z.enum(['active', 'inactive', 'draft']).optional()
}).strict()

// ─── Exports ─────────────────────────────────────────────────
module.exports = {
  // Orders
  validateCreateOrder:        validate(createOrderSchema),
  validateUpdateOrder:        validate(updateOrderSchema),

  // Reservations
  validateReservationStatus:  validate(updateReservationStatusSchema),
  validateAddExhibitors:      validate(addExhibitorsSchema),
  validateStoreSettings:      validate(updateStoreSettingsSchema),

  // Events
  validateReserveBooth:       validate(reserveBoothSchema),
  validateBuySeats:           validate(buySeatsSchema),

  // Payouts
  validateCreatePayout:       validate(createPayoutSchema),
  validateUpdatePayoutStatus: validate(updatePayoutStatusSchema),

  // Merchandise
  validateCreateMerchandise:  validate(createMerchandiseSchema),
  validateUpdateMerchandise:  validate(updateMerchandiseSchema),
}
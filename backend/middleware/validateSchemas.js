// backend/middleware/validateSchemas.js
const { z } = require('zod')

// ─── Reusable factory ────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      console.log("Zod Validation Failed:", JSON.stringify(result.error.flatten().fieldErrors, null, 2), "on body:", req.body);
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
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      name: z.string().optional(),
      price: z.number().optional(),
      quantity: z.number().int().min(1),
      image: z.string().optional().nullable()
    })
  ).min(1, 'At least one item is required'),
  sponsorId: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  boothCode: z.string().trim().min(1),
  storeName: z.string().trim().min(1),
  totalAmount: z.number().min(0),
  paymentMethod: z.string().trim().optional(),
  appliedGift: z.string().trim().optional().nullable(),
  giftCode: z.string().trim().optional()
});

const updateOrderSchema = z.object({
  status: z.enum(['Pending', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled']).optional(),
  paymentStatus: z.enum(['Unpaid', 'Paid', 'Refunded', 'Pending']).optional()
});

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
  paymentMethod:  z.string().trim().min(1).optional().default('invoice'),
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
  paymentMethod: z.string().trim().min(1).optional().default('invoice'),
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
  price:       z.coerce.number().finite().nonnegative('price must be 0 or greater'),
  category:    z.string().trim().min(1, 'category is required'),
  stock:       z.coerce.number().nonnegative().transform(v => Math.floor(v)).optional(),
  image:       z.string().trim().optional().nullable(),
  eventId:     z.string().trim().min(1, 'eventId is required'),
  boothCode:   z.string().trim().optional(),
  status:      z.enum(['Available', 'Out of Stock', 'Hidden']).optional()
})

const updateMerchandiseSchema = z.object({
  name:        z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  price:       z.coerce.number().finite().nonnegative().optional(),
  category:    z.string().trim().optional(),
  stock:       z.coerce.number().nonnegative().transform(v => Math.floor(v)).optional(),
  image:       z.string().trim().optional().nullable(),
  boothCode:   z.string().trim().optional(),
  status:      z.enum(['Available', 'Out of Stock', 'Hidden']).optional()
})

// ─── Pagination ──────────────────────────────
const offsetPaginationSchema = z.object({
  page:   z.coerce.number().int().min(1).optional(),
  limit:  z.coerce.number().int().min(1).max(100).optional(),
  sort:   z.string().trim().optional(),
  order:  z.enum(['asc','desc']).optional(),
  search: z.string().trim().optional()
})

const cursorPaginationSchema = z.object({
  cursor: z.string().trim().optional(),
  limit:  z.coerce.number().int().min(1).max(100).optional(),
  sort:   z.string().trim().optional(),
  order:  z.enum(['asc','desc']).optional()
})

// ─── Exports ─────────────────────────────────────────────────
module.exports = {

  validateOffsetQuery: validateQuery(offsetPaginationSchema),
validateCursorQuery: validateQuery(cursorPaginationSchema),

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
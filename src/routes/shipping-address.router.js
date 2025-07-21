import { Router } from 'express'
import { shippingAddressController } from '../controllers/shipping-address.controller.js'
import { authenticateToken as authMiddleware } from '../middlewares/auth.middleware.js'
import { shippingAddressOwnershipMiddleware } from '../middlewares/shipping-address-ownership.middleware.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: ShippingAddresses
 *   description: Shipping address management
 */

/**
 * @swagger
 * /api/shipping-addresses:
 *   get:
 *     summary: Get all shipping addresses for the current user
 *     tags: [ShippingAddresses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user shipping addresses
 */
router.get('/',
  authMiddleware,
  shippingAddressController.getUserAddresses.bind(shippingAddressController)
)

/**
 * @swagger
 * /api/shipping-addresses/default:
 *   get:
 *     summary: Get default shipping address for the current user
 *     tags: [ShippingAddresses]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Default shipping address
 */
router.get('/default',
  authMiddleware,
  shippingAddressController.getDefaultAddress.bind(shippingAddressController)
)

/**
 * @swagger
 * /api/shipping-addresses:
 *   post:
 *     summary: Create a new shipping address
 *     tags: [ShippingAddresses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *               - street
 *               - postalCode
 *               - country
 *               - locality
 *             properties:
 *               state:
 *                 type: string
 *               street:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               apt:
 *                 type: number
 *               locality:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Shipping address created
 */
router.post('/',
  authMiddleware,
  shippingAddressController.createAddress.bind(shippingAddressController)
)

/**
 * @swagger
 * /api/shipping-addresses/{addressId}:
 *   put:
 *     summary: Update a shipping address
 *     tags: [ShippingAddresses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *               - street
 *               - postalCode
 *               - country
 *               - locality
 *             properties:
 *               state:
 *                 type: string
 *               street:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               apt:
 *                 type: number
 *               locality:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Shipping address updated
 */
router.put('/:addressId',
  authMiddleware,
  shippingAddressOwnershipMiddleware(),
  shippingAddressController.updateAddress.bind(shippingAddressController)
)

/**
 * @swagger
 * /api/shipping-addresses/{addressId}:
 *   delete:
 *     summary: Delete a shipping address
 *     tags: [ShippingAddresses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping address deleted
 */
router.delete('/:addressId',
  authMiddleware,
  shippingAddressOwnershipMiddleware(),
  shippingAddressController.deleteAddress.bind(shippingAddressController)
)

/**
 * @swagger
 * /api/shipping-addresses/{addressId}/default:
 *   post:
 *     summary: Set an address as the default shipping address
 *     tags: [ShippingAddresses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default shipping address updated
 */
router.post('/:addressId/default',
  authMiddleware,
  shippingAddressOwnershipMiddleware(),
  shippingAddressController.setDefaultAddress.bind(shippingAddressController)
)

export default router

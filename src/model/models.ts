import Model from './query-builder';
import Users from './lib/users';
import Product from './lib/product';
import ProductCategory from './lib/product-category';
import ProductSubCategory from './lib/product-subcategory';
import ProductBrand from './lib/product-brand';
import Zone from './lib/zone';
import Pincode from './lib/pincode';
import Cms from './lib/cms';
import Banner from './lib/banner';
import TaxMaster from './lib/taxMaster';
import VariantMaster from './lib/variantMaster';
import CouponMaster from './lib/couponMaster';
import Driver from './lib/driver';
import UserAddress from './lib/user-address';
import Cart from './lib/cart';
import OrderStatus from './lib/order-status';
import QrCode from './lib/qrcode';
import Order from './lib/order';
import OrderDetail from './lib/order-detail';
import OrderReturn from './lib/order-return';
import ReturnDetail from './lib/return-detail';
import UserWallet from './lib/user-wallet';
import UserTransaction from './lib/user-transaction';
import MisCharge from './lib/mischarges';
import DriverStatus from './lib/driver-status';
import DeliverySlot from './lib/delivery-slot';

/**
 * This is model
 * relation with database table
 * use this as a object of a table
 */
export const AuditModel = () => new Model('audit_trail');
export const UserModel = () => new Users('users');
export const ProductModel = () => new Product('product');
export const ProductVariantModel = () => new Model('product_variant');
export const ProductInventoryModel = () => new Model('product_inventory');
export const ProductInventoryHistoryModel = () => new Model('inventory_history');
export const ProductCategoryModel = () => new ProductCategory('product_category');
export const ProductSubCategoryModel = () => new ProductSubCategory('product_subcategory');
export const ProductBrandModel = () => new ProductBrand('product_brand');
export const ZoneModel = () => new Zone('zone');
export const PincodeModel = () => new Pincode('pincode');
export const CmsModel = () => new Cms('cms');
export const BannerModel = () => new Banner('banner');
export const TaxMasterModel = () => new TaxMaster('tax_master');
export const VariantMasterModel = () => new VariantMaster('variant_master');
export const DriverModel = () => new Driver('driver');
export const UserAddressModel = () => new UserAddress('user_address');
export const CouponMasterModel = () => new CouponMaster('coupon_master');
export const CartMasterModel = () => new Cart('user_cart');
export const OrderStatusModel = () => new OrderStatus('order_status');
export const QrCodeModel = () => new QrCode('qrcode');
export const OrderModel = () => new Order('orders');
export const OrderDetailModel = () => new OrderDetail('order_detail');
export const OrderReturnModel = () => new OrderReturn('order_return');
export const ReturnDetailModel = () => new ReturnDetail('return_detail');
export const UserWalletModel = () => new UserWallet('user_wallet');
export const UserTransactionModel = () => new UserTransaction('user_transaction');
export const MisChargeModel = () => new MisCharge('misccharges');
export const DriverStatusModel = () => new DriverStatus('driver_order_status');
export const DeliverySlotModel = () => new DeliverySlot('delivery_slots');

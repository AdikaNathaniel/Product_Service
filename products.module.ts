import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Products, ProductSchema } from 'src/shared/schema/products';
import { Users, UserSchema } from 'src/shared/schema/users';
import config from 'config';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { ProductRepository } from 'src/shared/repositories/product.respository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { License, LicenseSchema } from 'src/shared/schema/license';
import { Orders, OrderSchema } from 'src/shared/schema/orders';
import { OrdersRepository } from 'src/shared/repositories/order.repository';
import Stripe from 'stripe';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    UserRepository,
    OrdersRepository,
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: 'STRIPE_CLIENT',
      useFactory: () => {
        return new Stripe(config.get('stripe.secret_key'), {
          apiVersion: '2024-12-18.acacia',
        });
      },
    },
  ],
  imports: [
    MongooseModule.forFeature([{ name: Products.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
    MongooseModule.forFeature([{ name: Orders.name, schema: OrderSchema }]),
  ],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: `${config.get('appPrefix')}/products`,
          method: RequestMethod.GET,
        },
        {
          path: `${config.get('appPrefix')}/products/:id`,
          method: RequestMethod.GET,
        },
      )
      .forRoutes(ProductsController);
  }
}
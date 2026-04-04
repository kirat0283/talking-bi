import random
from datetime import datetime, timedelta
from database import SessionLocal, Base, engine
from models import Product, Customer, Order, OrderItem

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        if db.query(Product).first():
            print("Database already seeded!")
            return

        print("Seeding database...")
        categories = ["Electronics", "Clothing", "Home", "Sports", "Books"]
        regions = ["North America", "Europe", "Asia", "South America", "Australia"]
        
        # Products
        products = []
        for i in range(1, 21):
            p = Product(name=f"Product {i}", category=random.choice(categories), price=round(random.uniform(10.0, 500.0), 2))
            products.append(p)
        db.add_all(products)
        db.commit()
        
        # Customers
        customers = []
        for i in range(1, 51):
            c = Customer(name=f"Customer {i}", region=random.choice(regions))
            customers.append(c)
        db.add_all(customers)
        db.commit()
        
        # Orders & OrderItems
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        orders_batch = []
        order_items_batch = []
        
        for i in range(1, 501):
            random_days = random.randint(0, 365)
            order_date = start_date + timedelta(days=random_days)
            c = random.choice(customers)
            
            o = Order(customer_id=c.id, order_date=order_date.date(), total_amount=0.0)
            orders_batch.append(o)
            
        db.add_all(orders_batch)
        db.commit()
        
        # Now create items for orders
        for o in db.query(Order).all():
            num_items = random.randint(1, 5)
            total = 0.0
            
            for _ in range(num_items):
                p = random.choice(products)
                qty = random.randint(1, 3)
                price_at_purchase = p.price
                item_total = qty * price_at_purchase
                total += item_total
                
                oi = OrderItem(order_id=o.id, product_id=p.id, quantity=qty, price_at_purchase=price_at_purchase)
                order_items_batch.append(oi)
                
            o.total_amount = round(total, 2)
            
        db.add_all(order_items_batch)
        db.commit()
        
        print("Done seeding.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()

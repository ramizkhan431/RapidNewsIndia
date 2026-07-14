import os
import sys
from datetime import datetime, timedelta

# Add backend app directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models import User, Role, Reporter, Category, News, Media, Submission, Notification
from app.core.security import get_password_hash
from app.services import init_roles_and_admin, generate_slug

def seed():
    print("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding base roles and administrative accounts...")
        init_roles_and_admin(db)
        
        # Get role references
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        reporter_role = db.query(Role).filter(Role.name == "reporter").first()
        user_role = db.query(Role).filter(Role.name == "user").first()
        
        # 1. Create a mock Reporter user
        reporter_email = "kolkata_reporter@rapidnewsindia.com"
        db_rep_user = db.query(User).filter(User.email == reporter_email).first()
        if not db_rep_user:
            db_rep_user = User(
                email=reporter_email,
                hashed_password=get_password_hash("reporter123"),
                full_name="Joydeep Banerjee",
                role_id=reporter_role.id,
                is_active=True
            )
            db.add(db_rep_user)
            db.flush()
            
            db_reporter = Reporter(
                user_id=db_rep_user.id,
                district="Kolkata",
                state="West Bengal",
                bio="Senior State & District reporter specializing in regional affairs and sports.",
                is_approved=True
            )
            db.add(db_reporter)
            db.flush()
            print("Mock approved reporter created.")
        else:
            db_reporter = db.query(Reporter).filter(Reporter.user_id == db_rep_user.id).first()

        # 2. Add District Categories under the parent Categories
        national_cat = db.query(Category).filter(Category.slug == "national").first()
        state_cat = db.query(Category).filter(Category.slug == "state").first()
        district_cat = db.query(Category).filter(Category.slug == "district").first()
        
        districts = [
            ("Kolkata", "kolkata", "West Bengal"),
            ("Patna", "patna", "Bihar"),
            ("Lucknow", "lucknow", "Uttar Pradesh"),
            ("Mumbai", "mumbai", "Maharashtra"),
            ("Delhi", "delhi", "Delhi")
        ]
        
        district_objs = {}
        for name, slug, state in districts:
            cat = db.query(Category).filter(Category.slug == slug).first()
            if not cat:
                cat = Category(
                    name=name,
                    slug=slug,
                    level="district",
                    parent_id=district_cat.id
                )
                db.add(cat)
                db.flush()
            district_objs[slug] = cat
            
        print("District categories seeded.")

        # 3. Create Multi-language News Articles
        articles_data = [
            # English Article
            {
                "title": "India's Tech Sector Booms: Kolkata Drives Regional Digital Growth",
                "content": "<p>India's software and technology services export sector is witnessing a strong growth trend in eastern India. Kolkata, with its expanding IT parks in Sector V and Rajarhat, has registered a 14% year-on-year increase in tech job hiring.</p><p>State administrators announced new incentives for startups setting up operations in Bengal, including tax subsidies and high-speed infrastructure support. Local tech leaders believe this move will retain top engineering talent within the state.</p>",
                "language": "en",
                "status": "published",
                "published_at": datetime.utcnow() - timedelta(hours=2),
                "author_id": db_rep_user.id,
                "category_id": district_objs["kolkata"].id,
                "youtube": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "images": ["https://images.unsplash.com/photo-1519389950473-47ba0277781c"]
            },
            # Bengali Article
            {
                "title": "কলকাতা বইমেলায় রেকর্ড ভিড়: বাংলায় সাহিত্যপ্রেমীদের ঢল",
                "content": "<p>আন্তর্জাতিক কলকাতা বইমেলা এ বছর এক অভূতপূর্ব সাড়া ফেলেছে। প্রথম পাঁচ দিনেই দর্শনার্থীদের সংখ্যা প্রায় দশ লাখ ছাড়িয়ে গিয়েছে। বিভিন্ন প্রকাশনা সংস্থা জানিয়েছে, এ বছর বাংলা উপন্যাস ও প্রবন্ধের বিক্রি রেকর্ড ভেঙেছে।</p><p>মেলা প্রাঙ্গণে নিরাপত্তা জোরদার করা হয়েছে এবং পাঠকদের সুবিধার্থে বিশেষ বাসের ব্যবস্থা করেছে রাজ্য পরিবহন দপ্তর। তরুণ লেখকদের নতুন বইগুলো এ বছর সবচেয়ে বেশি বিক্রি হচ্ছে বলে প্রকাশকরা জানিয়েছেন।</p>",
                "language": "bn",
                "status": "published",
                "published_at": datetime.utcnow() - timedelta(hours=5),
                "author_id": db_rep_user.id,
                "category_id": district_objs["kolkata"].id,
                "youtube": "",
                "images": ["https://images.unsplash.com/photo-1544947950-fa07a98d237f"]
            },
            # Hindi Article
            {
                "title": "उत्तर प्रदेश में नई सौर ऊर्जा नीति को मंजूरी: हजारों घरों को मिलेगी सस्ती बिजली",
                "content": "<p>उत्तर प्रदेश सरकार ने अपनी महत्वाकांक्षी सौर ऊर्जा नीति 2026 को कैबिनेट की मंजूरी दे दी है। इसके तहत राज्य के प्रमुख जिलों में बड़े सोलर पार्क स्थापित किए जाएंगे। लखनऊ, वाराणसी और प्रयागराज में पहले चरण का कार्य अगले महीने से शुरू होगा।</p><p>इस नीति का मुख्य उद्देश्य बिजली दरों में कटौती करना और हरित ऊर्जा को बढ़ावा देना है। सरकारी भवनों पर भी रूफटॉप सोलर पैनल लगाए जाएंगे।</p>",
                "language": "hi",
                "status": "published",
                "published_at": datetime.utcnow() - timedelta(days=1),
                "author_id": db_rep_user.id,
                "category_id": district_objs["lucknow"].id,
                "youtube": "https://www.youtube.com/embed/y918b958",
                "images": ["https://images.unsplash.com/photo-1509391366360-2e959784a276"]
            },
            # Scheduled English Article
            {
                "title": "National Green Expressway Project to Connect Delhi and Lucknow by Next Year",
                "content": "<p>The Ministry of Road Transport and Highways has accelerated the construction of the new Green Expressway between Delhi and Lucknow. The project is estimated to reduce travel time to under five hours while implementing sustainable eco-corridors along the highway.</p>",
                "language": "en",
                "status": "scheduled",
                "published_at": datetime.utcnow() + timedelta(days=2),
                "author_id": db_rep_user.id,
                "category_id": national_cat.id,
                "youtube": "",
                "images": ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5"]
            }
        ]

        for data in articles_data:
            slug = generate_slug(data["title"])
            # Check if exists
            news = db.query(News).filter(News.slug == slug).first()
            if not news:
                news = News(
                    title=data["title"],
                    slug=slug,
                    content=data["content"],
                    language=data["language"],
                    status=data["status"],
                    published_at=data["published_at"],
                    author_id=data["author_id"],
                    category_id=data["category_id"]
                )
                db.add(news)
                db.flush()
                
                # Add Youtube media
                if data["youtube"]:
                    media_yt = Media(
                        media_type="youtube",
                        url=data["youtube"],
                        title="YouTube Video Stream",
                        news_id=news.id
                    )
                    db.add(media_yt)
                
                # Add image media
                for idx, img_url in enumerate(data["images"]):
                    media_img = Media(
                        media_type="image",
                        url=img_url,
                        title=f"Featured Image {idx+1}",
                        news_id=news.id
                    )
                    db.add(media_img)
        
        print("Mock news articles seeded.")

        # 4. Create User Submissions
        submission_email = "citizen_rahul@gmail.com"
        existing_sub = db.query(Submission).filter(Submission.reporter_email == submission_email).first()
        if not existing_sub:
            sub = Submission(
                submission_type="complaint",
                title="Pothole issues on Kolkata Bypass Road causing daily accidents",
                content="The main bypass road near Salt Lake is filled with deep potholes due to the early pre-monsoon showers. It has caused traffic bottlenecks and multiple two-wheeler accidents. Authorities must look into this urgently.",
                reporter_name="Rahul Sharma",
                reporter_email=submission_email,
                district="Kolkata",
                status="pending"
            )
            db.add(sub)
            db.flush()
            
            # Attach image to submission
            sub_media = Media(
                media_type="image",
                url="https://images.unsplash.com/photo-1515162305285-0293e4767cc2",
                title="Potholes on road",
                submission_id=sub.id
            )
            db.add(sub_media)
            print("Mock user submission created.")

        db.commit()
        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()

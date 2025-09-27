# Rental Property Management System

A comprehensive full-stack web application for managing multiple rental properties, tenants, payments, and maintenance requests.

## 🚀 Features

### Core Functionality
- **Property Management**: Add, edit, and manage rental properties with detailed information
- **Tenant Management**: Track tenant information, lease details, and contact information
- **Payment Tracking**: Monitor rent payments, overdue amounts, and payment history
- **Asset Management**: Track property assets, appliances, and maintenance records
- **Maintenance Requests**: Handle maintenance requests and work orders
- **Reports & Analytics**: Generate financial and occupancy reports
- **User Roles**: Admin, Property Manager, and Accountant roles with different access levels

### Technical Features
- **Responsive Design**: Mobile-friendly interface for on-the-go access
- **Real-time Updates**: Live dashboard with current property and financial status
- **Search & Filtering**: Advanced search and filtering capabilities
- **Role-based Access**: Secure access control based on user roles
- **Modern UI**: Clean, intuitive interface built with React and Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form handling and validation
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Database
- **MongoDB** - Document-based database
- **Mongoose ODM** - Object Document Mapper

## 📁 Project Structure

```
rent-management/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── server/                 # Express backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Docker orchestration
├── mongo-init.js         # Database initialization
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- Docker (optional)

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rent-management
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**
   ```bash
   # Copy server environment file
   cp server/env.example server/.env
   
   # Edit server/.env with your configuration
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rent-management

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Configuration

Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Users
- Personal information and authentication
- Role-based access control
- Assigned properties (for property managers)

### Properties
- Property details and specifications
- Financial information (rent, deposits)
- Status tracking (occupied, vacant, maintenance)
- Photo and amenity management

### Tenants
- Personal and contact information
- Lease details and terms
- Payment preferences
- Notes and communication history

### Payments
- Rent payment tracking
- Payment methods and references
- Due dates and late fees
- Status management (pending, paid, overdue)

### Assets
- Property asset inventory
- Maintenance history
- Warranty and purchase information
- Status tracking

### Maintenance Requests
- Request details and priority
- Assignment to vendors/technicians
- Cost tracking and completion status
- Photo attachments and notes

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full access to all features and data
- **Property Manager**: Limited access to assigned properties
- **Accountant**: Read-only access to financial data

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based route protection
- Input validation and sanitization
- Rate limiting and security headers

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Properties
- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Tenants
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment record
- `PUT /api/payments/:id` - Update payment
- `POST /api/payments/:id/mark-paid` - Mark payment as paid

### Reports
- `GET /api/reports/dashboard` - Dashboard summary
- `GET /api/reports/income` - Income reports
- `GET /api/reports/maintenance` - Maintenance reports
- `GET /api/reports/occupancy` - Occupancy reports

## 🚀 Deployment

### Docker Deployment
The application is containerized and ready for deployment with Docker Compose.

### Cloud Deployment Options

#### Vercel + Railway
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Use MongoDB Atlas for database

#### AWS/GCP/Azure
1. Use container services (ECS, Cloud Run, Container Instances)
2. Set up managed MongoDB (DocumentDB, Atlas)
3. Configure load balancers and CDN

### Environment Setup
1. Set production environment variables
2. Configure CORS for production domains
3. Set up SSL certificates
4. Configure monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Document management
- [ ] Advanced reporting with charts
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Automated rent reminders
- [ ] Integration with payment gateways
- [ ] Property photo galleries
- [ ] Tenant portal
- [ ] Maintenance scheduling
- [ ] Financial forecasting
- [ ] Property valuation tracking

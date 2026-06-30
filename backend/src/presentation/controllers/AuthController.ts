import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../infrastructure/web/middlewares';
import { User, PregnancyProfile } from '../../infrastructure/database/models';
import { env } from '../../config/env';

export class AuthController {
  /**
   * Registers a new user (profile is created separately)
   */
  public static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name, age } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email address already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        age,
        role: 'mother',
      });
      await user.save();

      // Generate JWT
      const token = jwt.sign({ userId: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          role: user.role,
        },
        profile: null, // No profile created yet
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred during registration.' });
    }
  }

  /**
   * Authenticates user and issues JWT token
   */
  public static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Fetch pregnancy profile
      const profile = await PregnancyProfile.findOne({ userId: user._id });

      // Generate JWT
      const token = jwt.sign({ userId: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          role: user.role,
        },
        profile: profile ? {
          id: profile._id,
          pregnancyWeek: profile.pregnancyWeek,
          trimester: profile.trimester,
          expectedDeliveryDate: profile.expectedDeliveryDate,
          weight: profile.weight,
          bloodGroup: profile.bloodGroup,
          // backwards compatibility
          gestationalAgeWeeks: profile.gestationalAgeWeeks,
          dueDate: profile.dueDate,
          doctorName: profile.doctorName,
          emergencyContact: profile.emergencyContact,
        } : null,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error occurred during login.' });
    }
  }

  /**
   * Retrieves active profile details
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const profile = await PregnancyProfile.findOne({ userId });

      return res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          role: user.role,
        },
        profile: profile ? {
          id: profile._id,
          pregnancyWeek: profile.pregnancyWeek,
          trimester: profile.trimester,
          expectedDeliveryDate: profile.expectedDeliveryDate,
          weight: profile.weight,
          bloodGroup: profile.bloodGroup,
          gestationalAgeWeeks: profile.gestationalAgeWeeks,
          dueDate: profile.dueDate,
          doctorName: profile.doctorName,
          emergencyContact: profile.emergencyContact,
        } : null,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error fetching user profile.' });
    }
  }
}

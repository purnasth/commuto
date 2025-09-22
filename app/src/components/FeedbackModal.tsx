import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { RideFormData } from '../interfaces/types';

import {
  USER_ROLE,
  FEEDBACK_EMOJI,
  FEEDBACK_EMOJI_CHARS,
} from '../constants/enums';
import { ROUTE_PROFILE } from '../constants/routes';

import { apiFetch } from '../utils/api';

interface FeedbackModalProps {
  onClose: () => void;
  handleCompleteRide: (ride: RideFormData) => Promise<void>;
  rideDetails: RideFormData;
  user: { id: number; role?: string } | null;
}

interface FeedbackSubmissionData {
  rideId: number;
  fromUserId: number;
  toUserId: number;
  role: USER_ROLE;
  emoji: FEEDBACK_EMOJI;
  comment?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  onClose,
  handleCompleteRide,
  rideDetails,
  user,
}) => {
  const navigate = useNavigate();

  const [selectedEmoji, setSelectedEmoji] = useState<FEEDBACK_EMOJI | null>(
    null,
  );
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackAlreadySubmitted, setFeedbackAlreadySubmitted] =
    useState(false);

  // Check on component mount
  React.useEffect(() => {
    const checkExistingFeedback = async () => {
      const feedbackKey = `feedback_${rideDetails.id}_${user?.id}`;
      const submitted = localStorage.getItem(feedbackKey);
      if (submitted) {
        setFeedbackAlreadySubmitted(true);
      }
    };

    checkExistingFeedback();
  }, [rideDetails.id, user?.id]);

  // Determine user's role in this ride - riderId and passengerId are numbers from backend
  const userRole =
    user?.id === Number(rideDetails.riderId)
      ? USER_ROLE.RIDER
      : USER_ROLE.PASSENGER;

  // Determine who receives the feedback
  let toUserId: number = 0;
  const isRider = user?.id === Number(rideDetails.riderId);
  const isPassenger = user?.id === Number(rideDetails.passengerId);

  if (isRider && rideDetails.passengerId) {
    // Current user is rider, feedback goes to passenger
    toUserId = Number(rideDetails.passengerId);
  } else if (isPassenger && rideDetails.riderId) {
    // Current user is passenger, feedback goes to rider
    toUserId = Number(rideDetails.riderId);
  } else if (
    isRider &&
    rideDetails.passengers &&
    rideDetails.passengers.length > 0
  ) {
    // Fallback: try passengers array
    toUserId = rideDetails.passengers[0].id;
  } else if (isPassenger && rideDetails.rider) {
    // Fallback: try rider object
    toUserId = rideDetails.rider.id;
  }

  //   TODO: use the enums here instead of another static emojiOptions.
  // Available emoji options
  const emojiOptions = [
    {
      value: FEEDBACK_EMOJI.SATISFIED,
      char: FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.SATISFIED],
      label: 'Satisfied',
    },
    {
      value: FEEDBACK_EMOJI.NEUTRAL,
      char: FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.NEUTRAL],
      label: 'Neutral',
    },
    {
      value: FEEDBACK_EMOJI.DISSATISFIED,
      char: FEEDBACK_EMOJI_CHARS[FEEDBACK_EMOJI.DISSATISFIED],
      label: 'Not Satisfied',
    },
  ];

  const getRoleBasedPrompt = () => {
    if (userRole === USER_ROLE.RIDER) {
      return {
        title: 'Complete Your Feedback to Earn Karma Points!',
        description:
          'Your feedback helps improve the ride experience. Complete this to earn your karma points and unlock achievements!',
      };
    } else {
      return {
        title: 'Complete Your Feedback to Improve Your Credit Score!',
        description:
          'Your feedback helps improve the ride experience. Complete this to boost your credit score and unlock priority matching!',
      };
    }
  };

  const promptData = getRoleBasedPrompt();

  const handleSubmit = async () => {
    // Fix: Check for null/undefined specifically, not falsy values (since SATISFIED = 0)
    if (
      selectedEmoji === null ||
      selectedEmoji === undefined ||
      !user?.id ||
      !toUserId ||
      toUserId === 0
    ) {
      console.log('Validation failed - missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare feedback data
      const feedbackData: FeedbackSubmissionData = {
        rideId: Number(rideDetails.id),
        fromUserId: user.id,
        toUserId: toUserId,
        role: userRole,
        emoji: selectedEmoji!,
        comment: comment.trim() || undefined,
      };

      // Submit feedback to backend
      const response = await apiFetch<{
        message: string;
        feedback: {
          id: number;
          rideId: number;
          fromUserId: number;
          toUserId: number;
          role: string;
          emoji: number;
          comment: string | null;
          createdAt: string;
        };
        pointsAwarded: number;
        user: { id: number; karmaPoints: number; creditScore: number };
        feedbackComplete: boolean;
        waitingForOtherUser: boolean;
      }>(`${import.meta.env.VITE_API_BASE_URL}/rides/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      console.log('Feedback submitted successfully:', response);

      // Mark feedback as submitted for this user
      const feedbackKey = `feedback_${rideDetails.id}_${user?.id}`;
      localStorage.setItem(feedbackKey, 'true');

      // Update local user data
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userData.karmaPoints = response.user.karmaPoints;
        userData.creditScore = response.user.creditScore;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      if (response.feedbackComplete) {
        // Both users have submitted feedback, complete the ride
        await handleCompleteRide(rideDetails);

        // Clear ride status since both feedbacks are complete
        localStorage.setItem('rideStatus', 'idle');

        // Show success message and navigate
        toast.success('Thank you for your feedback!');
        toast.info(
          `You earned ${response.pointsAwarded} ${userRole === USER_ROLE.RIDER ? 'karma' : 'credit score'} points!`,
          { autoClose: 10000 }, // 10 seconds
        );

        // Close modal and navigate
        onClose();
        navigate(ROUTE_PROFILE);
      } else if (response.waitingForOtherUser) {
        // Current user submitted feedback, clear their status and navigate after showing toast
        localStorage.setItem('rideStatus', 'idle');

        toast.success('Thank you for your feedback!');
        toast.info(
          `You earned ${response.pointsAwarded} ${userRole === USER_ROLE.RIDER ? 'karma' : 'credit score'} points!`,
          { autoClose: 10000 }, // 10 seconds
        );

        // Close modal and navigate immediately
        onClose();
        navigate(ROUTE_PROFILE);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // You might want to show an error toast here
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex size-full min-h-screen items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-teal-300 bg-white p-10 shadow-lg">
        <div className="pointer-events-none absolute -left-[20%] top-1/2 -z-10 size-48 rounded-full bg-teal-300 blur-[80px]" />
        <div className="pointer-events-none absolute -right-10 -top-12 -z-10 size-40 rounded-full bg-teal-300 blur-[50px]" />

        {feedbackAlreadySubmitted ? (
          // Show feedback already submitted message
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Feedback Already Submitted
            </h2>
            <p className="mb-6 text-gray-600">
              You have already provided feedback for this ride. Thank you for
              your input!
            </p>
            <button
              onClick={onClose}
              className="rounded-full bg-teal-500 px-6 py-2 text-white hover:bg-teal-600"
            >
              Close
            </button>
          </div>
        ) : (
          // Show feedback form
          <>
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              {promptData.title}
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              {promptData.description}
            </p>

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-gray-700">
                How was your ride experience?{' '}
                <span className="text-red-500">*</span>
              </p>
              <div className="flex justify-center gap-3">
                {emojiOptions.map((option) => {
                  const isSelected = selectedEmoji === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedEmoji(option.value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                        isSelected
                          ? 'scale-105 border-teal-400 bg-teal-50 shadow-lg'
                          : 'hover:bg-teal-25 border-gray-200 bg-white hover:border-teal-200'
                      }`}
                      aria-label={`Rate ${option.label}`}
                    >
                      <span className="text-3xl">{option.char}</span>
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? 'text-teal-600' : 'text-gray-500'
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="feedback-comment"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Additional Comments (Optional)
              </label>
              <textarea
                id="feedback-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share more about your experience..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {comment.length}/500 characters
              </p>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  selectedEmoji === null ||
                  selectedEmoji === undefined ||
                  isSubmitting
                }
                className={`rounded-full px-6 py-2 text-sm font-medium text-white transition-colors ${
                  selectedEmoji === null || selectedEmoji === undefined
                    ? 'cursor-not-allowed bg-gray-400'
                    : isSubmitting
                      ? 'cursor-not-allowed bg-teal-400 opacity-75'
                      : 'bg-teal-500 hover:bg-teal-600'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>

            {(selectedEmoji === null || selectedEmoji === undefined) && (
              <p className="mt-3 text-center text-xs text-red-500">
                Please select an emoji rating to continue
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;

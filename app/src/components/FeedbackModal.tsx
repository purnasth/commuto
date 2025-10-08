import { toast } from 'react-toastify';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RideFormData } from '../interfaces/types';

import {
  USER_ROLE,
  RIDE_STATUS,
  EMOJI_OPTIONS,
  FEEDBACK_EMOJI,
  COMPLETION_LOCK_TIMEOUT_MS,
} from '../constants/enums';
import { ROUTE_PROFILE } from '../constants/routes';
import { API_RIDES_FEEDBACK } from '../constants/api';

import { apiFetch } from '../utils/api';
import { dispatchRideStatusChanged } from '../utils/customEvents';

import Modal from './ui/Modal';

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

  // Helper function to generate consistent completion keys
  const getCompletionKeys = (rideId: number) => {
    const completionKey = `completing_ride_${rideId}`;
    const timestampKey = `${completionKey}_timestamp`;
    return { completionKey, timestampKey };
  };

  const [selectedEmoji, setSelectedEmoji] = useState<FEEDBACK_EMOJI | null>(
    null,
  );
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackAlreadySubmitted, setFeedbackAlreadySubmitted] =
    useState(false);
  const [isCompletingRide, setIsCompletingRide] = useState(false);

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

  // Cleanup completion flag on unmount to prevent stale locks
  React.useEffect(() => {
    return () => {
      if (isCompletingRide) {
        const { completionKey, timestampKey } = getCompletionKeys(
          Number(rideDetails.id),
        );
        localStorage.removeItem(completionKey);
        localStorage.removeItem(timestampKey);
      }
    };
  }, [rideDetails.id, isCompletingRide]);

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

  const getRoleBasedPrompt = () => {
    if (userRole === USER_ROLE.RIDER) {
      return {
        title: 'Share your experience!',
        description:
          'Your experience will not be shown to the passenger, but it impacts the ride experience. Complete this to unlock achievements!',
      };
    } else {
      return {
        title: 'Share your experience!',
        description:
          'Your experience will not be shown to the rider, but it impacts the ride experience. Complete this to unlock priority matching!',
      };
    }
  };

  const promptData = getRoleBasedPrompt();

  // Helper to check if form data is valid for submission
  const isFormValid =
    selectedEmoji != null && user?.id && toUserId && toUserId !== 0;

  const handleSubmit = async () => {
    if (!isFormValid) {
      console.log('Validation failed - missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackSubmissionData = {
        rideId: Number(rideDetails.id),
        fromUserId: user.id,
        toUserId: toUserId,
        role: userRole,
        emoji: selectedEmoji!,
        comment: comment.trim() || undefined,
      };

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
      }>(`${import.meta.env.VITE_API_BASE_URL}${API_RIDES_FEEDBACK}`, {
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

      // Helper function to update status and trigger UI updates
      const updateStatusAndTriggerSync = (status: RIDE_STATUS) => {
        localStorage.setItem('rideStatus', status);
        // Trigger a custom event to notify other components of the status change
        dispatchRideStatusChanged({ status });
      };

      if (response.feedbackComplete) {
        // Both users have submitted feedback - prevent race condition when both users
        // submit feedback simultaneously by using localStorage locks with timestamp expiry
        const { completionKey, timestampKey } = getCompletionKeys(
          Number(rideDetails.id),
        );
        const completionTimestamp = localStorage.getItem(timestampKey);

        // Check if completion is stale (older than configured timeout) and clear it
        const isStaleCompletion =
          completionTimestamp &&
          Date.now() - parseInt(completionTimestamp) >
            COMPLETION_LOCK_TIMEOUT_MS;

        if (isStaleCompletion) {
          localStorage.removeItem(completionKey);
          localStorage.removeItem(timestampKey);
        }

        const isAlreadyCompleting =
          localStorage.getItem(completionKey) && !isStaleCompletion;

        if (
          rideDetails.status !== RIDE_STATUS.COMPLETED &&
          !isAlreadyCompleting &&
          !isCompletingRide
        ) {
          try {
            // Mark completion as in progress with timestamp to prevent race conditions
            setIsCompletingRide(true);
            localStorage.setItem(completionKey, 'true');
            localStorage.setItem(timestampKey, Date.now().toString());

            await handleCompleteRide(rideDetails);
          } catch (error) {
            console.error('Error completing ride:', error);
            throw error; // Re-throw to be handled by outer catch block
          } finally {
            // Always clean up completion flag
            localStorage.removeItem(completionKey);
            localStorage.removeItem(timestampKey);
            setIsCompletingRide(false);
          }
        }

        // Clear ride status since both feedbacks are complete
        updateStatusAndTriggerSync(RIDE_STATUS.IDLE);

        // Show success message and navigate
        toast.success('Thank you for your feedback!');
        toast.info(
          `You earned ${response.pointsAwarded} ${userRole === USER_ROLE.RIDER ? 'karma' : 'credit score'} points!`,
          { autoClose: 10000 }, // 10 seconds
        );

        onClose();
        navigate(ROUTE_PROFILE);
      } else if (response.waitingForOtherUser) {
        updateStatusAndTriggerSync(RIDE_STATUS.IDLE);

        toast.success('Thank you for your feedback!');
        toast.info(
          `You earned ${response.pointsAwarded} ${userRole === USER_ROLE.RIDER ? 'karma' : 'credit score'} points!`,
          { autoClose: 10000 }, // 10 seconds
        );

        onClose();
        navigate(ROUTE_PROFILE);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="relative w-full max-w-lg overflow-hidden border border-teal-300 bg-white p-6 shadow-xl dark:border-teal-300/50 dark:bg-dark md:p-8">
        <div className="top-1/5 pointer-events-none absolute -right-[20%] z-auto size-48 rounded-full bg-teal-300 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-0 -left-20 z-auto size-52 rounded-full bg-teal-300 blur-[50px] dark:opacity-70" />

        {!feedbackAlreadySubmitted && (
          <div className="relative">
            <h2 className="mb-2 text-xl font-semibold">{promptData.title}</h2>
            <p className="text-xs opacity-70">{promptData.description}</p>

            <hr className="my-6 dark:opacity-20" />

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium">
                How was your ride experience?{' '}
                <span className="text-red-500">*</span>
              </p>
              <div className="flex justify-start gap-3">
                {EMOJI_OPTIONS.map((option) => {
                  const isSelected = selectedEmoji === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedEmoji(option.value)}
                      className={`group relative z-auto flex w-full flex-col items-center gap-2 overflow-hidden rounded-xl border p-4 transition-all duration-150 hover:shadow-lg focus:outline-none focus:ring-1 focus:ring-teal-400 ${
                        isSelected
                          ? 'border-teal-300 bg-teal-200 dark:bg-teal-300'
                          : 'border-teal-300/50 bg-white ring-teal-300 hover:border-teal-300 hover:bg-teal-100/50 hover:ring-1 dark:bg-teal-950 dark:hover:bg-teal-300/30'
                      }`}
                      aria-label={`Rate ${option.label}`}
                    >
                      <span className="pointer-events-none absolute left-0 z-auto size-16 -translate-x-1/2 rounded-full bg-teal-300 opacity-30 blur-[10px]"></span>
                      <span className="pointer-events-none absolute right-0 top-1/2 z-auto size-24 translate-x-1/2 rounded-full bg-teal-300 opacity-60 blur-[20px]"></span>

                      <span className="transition-300 text-3xl group-hover:scale-125">
                        {option.char}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? 'text-dark' : 'opacity-70'
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
                className="mb-2 block text-sm font-medium"
              >
                Additional Comments (Optional)
              </label>
              <textarea
                id="feedback-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share more about your experience..."
                className="block w-full resize-none rounded-md bg-transparent px-4 py-2.5 text-sm font-normal text-dark outline outline-1 -outline-offset-1 outline-teal-500/50 placeholder:font-light placeholder:text-dark/40 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-400 active:bg-teal-50 dark:text-white dark:placeholder:text-light/60 active:dark:bg-teal-950"
                maxLength={150}
              />
              <p className="mt-1 text-right text-xs">
                {comment.length}/150 characters
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`rounded-full px-6 py-3 text-sm font-medium transition-colors dark:text-dark ${
                  !isFormValid
                    ? 'cursor-not-allowed bg-teal-400 text-white'
                    : isSubmitting
                      ? 'cursor-not-allowed bg-teal-400 text-light opacity-75'
                      : 'bg-teal-300 text-dark hover:bg-teal-400'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>

            <hr className="my-6 dark:opacity-20" />

            <span className="mt-2 text-xs">
              <strong className="uppercase">Note:</strong> Complete this
              feedback form to receive your{' '}
              {userRole === USER_ROLE.RIDER ? 'karma points.' : 'credit score.'}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FeedbackModal;

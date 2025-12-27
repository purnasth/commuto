import { toast } from 'react-toastify';
import { useMemo, useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { TbArrowNarrowLeft, TbGift, TbTrophy } from 'react-icons/tb';

import { redeemables } from '../constants/data';
import { ROUTE_EARN_KARMA } from '../constants/routes';

import { redeemReward } from '../utils/api';

import GiftCardVoucher from '../components/ui/GiftCardVoucher';
import ConfirmDialog from '../components/ui/ConfirmDialog';

import type { RedeemableReward, UserDetails } from '../interfaces/types';

import {
  getStoredUser,
  canRedeemReward,
  getRedeemProgress,
  getRedeemProgressBarColor,
} from '../utils/functions';
import { useKarmaPoints } from '../hooks/useKarmaPoints';

// TODO (refactor):
//   - Split this file into smaller components (e.g., RewardCard, ProgressBar)
//   - Move business logic to hooks or utility files if possible
//   - Keep RedeemPage focused on layout and orchestration
//   - Improves readability, maintainability, and testability

const RedeemPage = () => {
  const navigate = useNavigate();
  const { karmaPoints, refreshKarmaPoints } = useKarmaPoints();

  // State for voucher popup
  const [selectedReward, setSelectedReward] = useState<RedeemableReward | null>(
    null,
  );
  const [showVoucher, setShowVoucher] = useState(false);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionData, setRedemptionData] = useState<{
    id: number;
    rewardName: string;
    karmaPointsCost: number;
    redemptionCode: string;
    status: string;
    expiresAt: string;
    redeemedAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleRedeemClick = (reward: RedeemableReward) => {
    setSelectedReward(reward);
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !user) {
      setError('Missing reward or user information');
      return;
    }

    setIsRedeeming(true);
    setShowConfirm(false);

    try {
      // Call the API to redeem the reward
      const response = await redeemReward(selectedReward.id, {
        name: selectedReward.name,
        points: selectedReward.points,
        description: selectedReward.description,
      });

      if (response.success) {
        setRedemptionData(response.redemption);
        setShowVoucher(true);
        // Refresh karma points to reflect the deduction
        refreshKarmaPoints();
        toast.success(`Successfully redeemed ${selectedReward.name}!`);
      } else {
        setError('Redemption failed. Please try again.');
        toast.error('Redemption failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Redemption error:', err);

      let errorMessage = 'Failed to redeem reward. Please try again.';

      // Handle different types of errors
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCancelRedeem = () => {
    setShowConfirm(false);
    setSelectedReward(null);
    setError(null);
  };

  const handleCloseVoucher = () => {
    setShowVoucher(false);
    setSelectedReward(null);
    setRedemptionData(null);
    setError(null);
  };

  const redeemDisplay = useMemo(() => {
    return redeemables.map((item) => {
      const points = karmaPoints ?? 0;
      const canRedeem = canRedeemReward(points, item.points);
      const progress = getRedeemProgress(points, item.points);
      const progressBarColor = getRedeemProgressBarColor(progress, canRedeem);
      const badgeClass = canRedeem
        ? 'border-green-600/50 bg-green-100 text-green-700'
        : 'border-blue-600/50 bg-blue-100 text-blue-700';

      return { ...item, canRedeem, progress, progressBarColor, badgeClass };
    });
  }, [karmaPoints]);

  return (
    <>
      <Confetti
        // width={window.innerWidth}
        // height={window.innerHeight}
        // numberOfPieces={200}
        recycle={false}
        gravity={0.1}
        initialVelocityY={10}
        // tweenDuration={1000}
      />
      <main className="relative overflow-x-hidden">
        <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-amber-300 opacity-40 blur-[100px] dark:opacity-20" />
        <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-amber-300 opacity-80 blur-[200px] dark:opacity-40" />
        <div className="w-full">
          <div className="container mb-4 flex size-full max-w-4xl flex-col items-center justify-center gap-4 text-center md:mb-16">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase text-amber-700 sm:text-sm md:text-base">
              <TbTrophy className="text-lg text-amber-700" />
              Thank You for Your Contributions!
            </span>

            <h1 className="mt-4 text-2xl font-bold capitalize leading-snug text-amber-950 dark:text-amber-500 md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
              Redeem Your Karma Points
            </h1>

            <p className="max-w-2xl font-body text-xs text-amber-950 dark:text-amber-500 sm:text-sm md:text-base">
              Exchange your hard-earned karma points for exclusive rewards! The
              more you contribute, the more you can claim. Thank you for helping
              others & making a difference!
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 p-3 px-2 pt-0 md:flex-row md:justify-between md:gap-0">
            <button
              type="button"
              aria-label="Back to Dashboard"
              className="hidden rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-700 shadow hover:bg-amber-200 sm:block md:text-sm"
              onClick={() => navigate(-1)}
            >
              <TbArrowNarrowLeft className="inline-block align-middle" />
              Dashboard
            </button>
            <div className="relative mx-auto flex translate-y-3 flex-col items-center md:translate-y-5">
              <div className="relative mb-0 flex h-40 w-80 items-end justify-center drop-shadow-xl md:mb-2 md:h-48 md:w-96">
                <svg viewBox="0 0 320 160" className="absolute left-0 top-0">
                  <path
                    d="M40,148 A120,120 0 0,1 280,160"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="36"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                  <path
                    d="M40,160 A120,120 0 0,1 240,64"
                    fill="none"
                    stroke="#f59e42"
                    strokeWidth="36"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="mb-2 text-center">
                  <span className="text-5xl font-extrabold text-amber-600 dark:text-amber-500">
                    {karmaPoints ?? 0}
                  </span>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    Karma Points
                  </p>
                </div>
              </div>
            </div>
            <Link
              to={ROUTE_EARN_KARMA}
              className="hidden rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-700 shadow hover:bg-amber-200 sm:block md:text-sm"
            >
              How to earn?
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:px-2 lg:grid-cols-3">
            {redeemDisplay.map((item) => {
              const percent = Math.round(item.progress * 100);
              return (
                <div
                  key={item.name}
                  className={`group relative flex flex-col items-start overflow-hidden rounded-2xl border border-amber-300/70 p-5 shadow-sm transition hover:shadow dark:border-amber-300/20 md:p-7`}
                >
                  {item.canRedeem ? (
                    <>
                      <div className="pointer-events-none absolute left-0 -z-10 size-40 -translate-x-1/2 rounded-full bg-green-300 opacity-30 blur-[50px]" />
                      <div className="pointer-events-none absolute right-0 top-1/2 -z-10 size-80 translate-x-1/2 rounded-full bg-green-300 opacity-60 blur-[100px]" />
                    </>
                  ) : (
                    <>
                      <div className="pointer-events-none absolute left-0 -z-10 size-40 -translate-x-1/2 rounded-full bg-amber-300 opacity-30 blur-[50px]" />
                      <div className="pointer-events-none absolute right-0 top-1/2 -z-10 size-80 translate-x-1/2 rounded-full bg-amber-300 opacity-60 blur-[100px]" />
                    </>
                  )}

                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-1">
                      <TbGift className="text-amber-700 dark:text-slate-300" />
                      <h2 className="text-base font-semibold text-amber-700 dark:text-slate-300">
                        {item.name}
                      </h2>
                      <span className="text-xs font-medium text-amber-600 dark:text-slate-300">
                        ({item.points} points)
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-left text-xs text-gray-600 dark:text-slate-300">
                    {item.description}
                  </p>

                  <div className="mb-2 mt-5 w-full">
                    <div className="mb-1 flex items-center justify-end text-xs font-medium text-amber-700">
                      {/* <span className="font-bold">0</span> */}
                      <span className="font-bold">{item.points}</span>
                    </div>
                    <div className="relative h-3 w-full rounded-full border border-dark/20 bg-white dark:border-dark dark:bg-gray-200">
                      <div
                        className={`absolute left-0 top-0 h-2.5 rounded-full bg-gradient-to-r ${item.progressBarColor} transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                      <div
                        className="absolute -top-7 left-0"
                        style={{
                          left: percent <= 5 ? 0 : `calc(${percent}% - 1.5rem)`,
                        }}
                      >
                        <span className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs font-bold text-amber-700 shadow-sm">
                          {Math.floor(item.progress * item.points)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex w-full items-start justify-between gap-2">
                    {/* <span
                      className={`inline-flex -translate-y-2 items-center justify-center gap-1 rounded-full border px-1.5 py-px text-xxs font-medium ${item.badgeClass}`}
                    >
                      <span
                        className={`size-1 rounded-full ${item.canRedeem ? 'bg-green-600' : 'bg-blue-600'}`}
                      />
                      {item.canRedeem ? 'Unlocked' : 'Progress'}
                    </span> */}
                    {item.canRedeem ? (
                      <motion.div
                        className="flex items-center rounded-full border-[0.5px] border-green-600/50 bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        animate={{
                          boxShadow: [
                            '0 0 0px rgba(34, 197, 94, 0)',
                            '0 0 10px rgba(34, 197, 94, 0.5)',
                            '0 0 0px rgba(34, 197, 94, 0)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      >
                        <motion.div
                          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500"
                          animate={{
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                        />
                        Unlocked!
                      </motion.div>
                    ) : (
                      <motion.div
                        className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        animate={{
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      >
                        In Progress
                      </motion.div>
                    )}
                    <button
                      className={`absolute -bottom-px -right-px overflow-hidden rounded-2xl rounded-bl-none rounded-tr-none border border-amber-300/70 px-6 py-3 text-sm font-bold transition dark:border-amber-300/20 ${
                        item.canRedeem
                          ? 'bg-amber-300 text-amber-900 hover:bg-amber-400'
                          : 'cursor-not-allowed bg-gray-300 text-gray-800 opacity-80'
                      }`}
                      disabled={!item.canRedeem || isRedeeming}
                      aria-disabled={!item.canRedeem || isRedeeming}
                      onClick={() => item.canRedeem && handleRedeemClick(item)}
                    >
                      {isRedeeming ? 'Redeeming...' : 'Redeem now!'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showConfirm && !!selectedReward}
        title={`Confirm Redemption?`}
        description={
          selectedReward && (
            <>
              <p>
                Redeeming this{' '}
                <strong className="font-medium">{selectedReward.name}</strong>{' '}
                will deduct{' '}
                <strong className="font-medium">
                  {selectedReward.points} karma points
                </strong>{' '}
                from your account. Are you sure you want to proceed?
              </p>
              {error && (
                <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </>
          )
        }
        confirmText={isRedeeming ? 'Redeeming...' : 'Yes, Redeem'}
        cancelText="Cancel"
        onConfirm={handleConfirmRedeem}
        onCancel={handleCancelRedeem}
        loading={isRedeeming}
      />

      {showVoucher && selectedReward && user && redemptionData && (
        <GiftCardVoucher
          reward={selectedReward}
          userKarmaPoints={karmaPoints}
          onClose={handleCloseVoucher}
          userInfo={{
            name: user.fullname,
            email: user.email,
            id: user.id?.toString() || '',
          }}
          redemptionCode={redemptionData.redemptionCode}
          redemptionDate={redemptionData.redeemedAt}
          expiresAt={redemptionData.expiresAt}
        />
      )}
    </>
  );
};

export default RedeemPage;

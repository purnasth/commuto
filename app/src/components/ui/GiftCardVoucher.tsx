import QRCode from 'react-qr-code';
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { TbGift, TbDownload, TbX } from 'react-icons/tb';
import { RedeemableReward } from '../../interfaces/types';
import {
  getCurrentDate,
  generateVoucherId,
  formatVoucherDate,
  generateRewardAbbreviation,
} from '../../utils/functions';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';

interface GiftCardVoucherProps {
  reward: RedeemableReward;
  userKarmaPoints: number;
  onClose: () => void;
  userInfo: {
    name: string;
    email: string;
    id: string;
  };
}

const GiftCardVoucher: React.FC<GiftCardVoucherProps> = ({
  reward,
  userKarmaPoints,
  onClose,
  userInfo,
}) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const { generatePDF, isGenerating } = usePDFGenerator();

  const currentDate = getCurrentDate();

  // Generate voucher ID and QR data using utility functions
  const voucherId = generateVoucherId(reward.name);
  const qrData = JSON.stringify({
    voucherId,
    rewardName: reward.name,
    points: reward.points,
    description: reward.description,
    redeemedBy: userInfo.name,
    redeemedAt: currentDate.toISOString(),
    userEmail: userInfo.email,
    userId: userInfo.id,
  });

  const handleDownload = async () => {
    const element = voucherRef.current;
    if (!element) {
      alert('Voucher not ready for download. Please try again.');
      return;
    }

    try {
      const abbreviation = generateRewardAbbreviation(reward.name);
      const filename = `${abbreviation}_Voucher_${voucherId}.pdf`;

      await generatePDF(element, {
        filename,
        orientation: 'landscape',
        format: 'a4',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="mb-4 flex justify-end gap-2">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TbDownload className="text-lg" />
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            <TbX className="text-lg" />
            Close
          </button>
        </div>

        <div
          ref={voucherRef}
          className="voucher-card relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fed7aa 100%)',
            border: '4px dashed #d97706',
            minHeight: '600px',
            width: '900px', // Fixed width for consistent PDF generation
          }}
        >
          {/* Decorative Elements */}
          <div className="pointer-events-none absolute -left-4 -top-4 h-24 w-24 rounded-full bg-amber-300/30 blur-xl" />
          <div className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-orange-300/30 blur-xl" />

          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 flex items-center justify-center gap-3"
            >
              <TbGift className="text-4xl text-amber-700" />
              <h1 className="text-4xl font-bold text-amber-900">
                GIFT VOUCHER
              </h1>
              <TbGift className="text-4xl text-amber-700" />
            </motion.div>
            <p className="text-lg font-semibold text-amber-700">
              Commuto Karma Rewards
            </p>
            <div className="mx-auto mt-2 h-1 w-32 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            {/* Left Side - Reward Details */}
            <div className="flex-1">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="mb-4 text-3xl font-bold text-amber-900">
                  {generateRewardAbbreviation(reward.name)} - {reward.name}
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-amber-800">
                  {reward.description}
                </p>

                {/* Voucher Details */}
                <div className="rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur-sm">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-amber-900">
                        Points Required:
                      </span>
                      <span className="font-bold text-amber-700">
                        {reward.points}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-amber-900">
                        Redeemed By:
                      </span>
                      <span className="font-bold text-amber-700">
                        {userInfo.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-amber-900">
                        User Email:
                      </span>
                      <span className="font-bold text-amber-700">
                        {userInfo.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-amber-900">
                        Redeemed On:
                      </span>
                      <span className="font-bold text-amber-700">
                        {formatVoucherDate(currentDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-amber-900">
                        Your Karma Points:
                      </span>
                      <span className="font-bold text-green-600">
                        {userKarmaPoints}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side - QR Code */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center lg:w-80"
            >
              <div className="qr-code rounded-2xl bg-white p-6 shadow-xl">
                <QRCode
                  value={qrData}
                  size={200}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  viewBox="0 0 256 256"
                />
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-amber-800">
                Scan QR code to verify voucher
              </p>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <div className="voucher-id mb-4 rounded-lg bg-white/60 p-3 font-mono text-sm text-amber-900">
              Voucher ID: {voucherId}
            </div>

            <div className="validity text-amber-700">
              <p className="text-sm font-semibold">
                ✨ This voucher is valid for redemption at participating college
                facilities ✨
              </p>
              <p className="mt-1 text-xs">
                Valid for 30 days from issue date • Terms and conditions apply
              </p>
            </div>
          </motion.div>

          {/* Decorative Corner Elements */}
          <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-amber-600"></div>
          <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-amber-600"></div>
          <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-amber-600"></div>
          <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-amber-600"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default GiftCardVoucher;

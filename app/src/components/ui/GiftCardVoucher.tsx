import QRCode from 'react-qr-code';
import React, { useRef } from 'react';
import Confetti from 'react-confetti';
import { toast } from 'react-toastify';
import { TbDownload } from 'react-icons/tb';

import logo from '../../assets/logo/commuto.svg';
import logoAlt from '../../assets/logo/commuto-alt.svg';

import { RedeemableReward } from '../../interfaces/types';
import {
  getCurrentDate,
  addMonthsToDate,
  generateVoucherId,
  formatVoucherDate,
  generateRewardAbbreviation,
} from '../../utils/functions';

import { useTheme } from '../../contexts/ThemeProvider';

import { usePDFGenerator } from '../../hooks/usePDFGenerator';

import Modal from './Modal';

interface GiftCardVoucherProps {
  reward: RedeemableReward;
  userKarmaPoints: number | null;
  onClose: () => void;
  userInfo: {
    name: string;
    email: string;
    id: string;
  };
  redemptionCode?: string;
  redemptionDate?: string;
  expiresAt?: string;
}

const GiftCardVoucher: React.FC<GiftCardVoucherProps> = ({
  reward,
  onClose,
  userInfo,
  redemptionCode,
  redemptionDate,
  expiresAt,
}) => {
  const voucherRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { generatePDF, isGenerating } = usePDFGenerator();

  const currentDate = getCurrentDate();

  const voucherId = redemptionCode || generateVoucherId(reward.name, userInfo.id);
  const redeemedAt = redemptionDate ? new Date(redemptionDate) : currentDate;
  const expiryDate = expiresAt ? new Date(expiresAt) : addMonthsToDate(currentDate, 1);
  
  const qrData = JSON.stringify({
    voucherId,
    rewardName: reward.name,
    points: reward.points,
    description: reward.description,
    redeemedBy: userInfo.name,
    redeemedAt: redeemedAt.toISOString(),
    userEmail: userInfo.email,
    userId: userInfo.id,
    expiresAt: expiryDate.toISOString(),
  });

  const handleDownload = async () => {
    const element = voucherRef.current;
    if (!element) {
      toast.error('Voucher not ready for download. Please try again.');
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
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <>
      <Modal onClose={onClose}>
        <Confetti
          numberOfPieces={500}
          recycle={false}
          gravity={0.2}
          initialVelocityY={20}
          tweenDuration={5000}
        />
        <div className="relative inline-block h-full bg-white text-dark shadow-lg dark:bg-amber-950">
          <div className="mb-4 flex justify-between gap-2 border-b p-3 pb-4 shadow-sm sm:p-6 md:mb-6">
            <h2 className="inline-flex items-center gap-2.5">
              <img
                src={theme === 'dark' ? logo : logoAlt}
                alt="Logo"
                className="h-6 object-contain sm:h-9"
              />
            </h2>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="transition-150 group flex items-center gap-2 rounded-full bg-teal-400 py-2.5 pl-4 pr-5 text-xs text-dark shadow-lg hover:bg-teal-500 sm:text-sm"
            >
              <TbDownload className="text-lg" />
              {isGenerating ? 'Generating...' : 'Download'}
            </button>

            <p className="absolute bottom-1.5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/80 bg-amber-300 px-2.5 text-xs font-semibold uppercase sm:bottom-4 sm:text-sm">
              Redeemed
            </p>
            <p className="absolute left-1/2 top-[4.75rem] z-50 w-max -translate-x-1/2 rounded-full border border-amber-500/80 bg-amber-100 px-2.5 text-xxs md:top-[6.5rem]">
              Keep up the great work and collect more achievements!
            </p>
          </div>

          <div
            ref={voucherRef}
            className="voucher-card relative m-3 max-w-fit overflow-hidden rounded-3xl border-[3px] border-dashed border-amber-500 bg-amber-50 px-4 py-6 pt-6 sm:m-6 sm:p-8 md:max-w-4xl lg:w-full"
          >
            <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-amber-300 opacity-40 blur-[100px] dark:opacity-60" />
            <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-amber-300 opacity-80 blur-[200px] dark:opacity-80" />
            <div className="pointer-events-none absolute -left-4 -top-4 z-0 h-24 w-24 rounded-full bg-amber-300/30 blur-xl" />
            <div className="pointer-events-none absolute -bottom-4 -right-4 z-0 h-32 w-32 rounded-full bg-orange-300/30 blur-xl" />

            <div className="mt-4 text-center sm:mt-0">
              {/* <h2 className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase text-amber-700 sm:text-sm md:text-base">
                Karma Rewards
              </h2> */}
              <h3 className="reward-points text-base font-bold md:text-2xl">
                {reward.name}
              </h3>
              {/* <p className="text-xs leading-relaxed text-amber-800">
                {reward.description}
              </p> */}
            </div>

            <div className="z-10 mt-2 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-3">
              <div className="col-span-2">
                <div>
                  <span className="absolute right-4 top-4 text-xxs font-semibold uppercase underline sm:right-6 sm:top-6 sm:text-sm md:right-8 md:top-8">
                    {reward.points} karma points
                  </span>
                  <div className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8">
                    <img
                      src={logoAlt}
                      alt="Logo"
                      className="h-3 object-contain sm:h-5 md:h-6"
                    />
                  </div>
                  <ul className="mt-2 space-y-4">
                    <li className="flex flex-col">
                      <label
                        htmlFor="issued-to"
                        className="text-xs opacity-70 sm:text-sm"
                      >
                        Issued to:
                      </label>
                      <p
                        id="issued-to"
                        className="text-xl font-medium sm:text-2xl"
                      >
                        {userInfo.name}
                        {/* <span className="text-sm"> ({userInfo.email})</span> */}
                      </p>
                    </li>
                    <li className="flex flex-col">
                      <label
                        htmlFor="valid-until"
                        className="text-xs opacity-70 sm:text-sm"
                      >
                        Valid until:
                      </label>
                      <p
                        id="valid-until"
                        className="text-xl font-medium sm:text-2xl"
                      >
                        {formatVoucherDate(expiryDate)}
                      </p>
                    </li>
                    <li className="flex flex-col">
                      <label
                        htmlFor="voucher-code"
                        className="text-xs opacity-70 sm:text-sm"
                      >
                        Voucher Code:
                      </label>
                      <p
                        id="voucher-code"
                        className="w-full rounded bg-amber-200/50 px-3 py-2 text-center text-xl font-medium uppercase tracking-widest"
                      >
                        {voucherId}
                      </p>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-span-1 flex flex-col items-center">
                <div className="rounded-lg bg-white p-3 shadow">
                  <QRCode
                    value={qrData}
                    size={180}
                    fgColor="#92400E"
                    bgColor="#FFFFFF"
                  />
                </div>
                <span className="text-center text-xxs">
                  Scan to verify your reward
                </span>
              </div>
            </div>

            <hr className="my-4 border-amber-300/80 md:my-6" />

            <p className="mt-4 px-2 text-xxs md:mt-6 md:p-0 md:text-xs">
              <strong>Note:</strong> This voucher is valid for one-time use
              only. It must be redeemed according to the terms and conditions
              provided at the time of redemption. Please present this voucher at
              the time of use.
            </p>

            <div className="absolute left-2 top-2 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-amber-500 sm:left-3 sm:top-3"></div>
            <div className="absolute right-2 top-2 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-amber-500 sm:right-3 sm:top-3"></div>
            <div className="absolute bottom-2 left-2 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-amber-500 sm:bottom-3 sm:left-3"></div>
            <div className="absolute bottom-2 right-2 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-amber-500 sm:bottom-3 sm:right-3"></div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GiftCardVoucher;

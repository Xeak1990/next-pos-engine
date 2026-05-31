"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartWeb } from "../../context/CartContextWeb";

export default function CartIcon() {
  const { totalItems } = useCartWeb();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <Link href="/cart" className="relative inline-flex items-center justify-center">
      <div className="relative">
        <svg
          width="28"
          height="28"
          className="text-[#9CA3AF] hover:text-[#E8621A] transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6H18M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
        
        {isMounted && totalItems > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '12px',
              height: '16px',
              borderRadius: '9999px',
              backgroundColor: '#E8621A',
              color: 'white',
              fontSize: '9px',
              fontWeight: 'bold',
              paddingLeft: '2px',
              paddingRight: '2px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
    </Link>
  );
}
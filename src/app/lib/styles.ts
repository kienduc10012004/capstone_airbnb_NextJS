export const uiClassNames = {
  appContainer: "mx-auto w-full max-w-7xl px-4 sm:px-6",
  adminCard:
    "rounded-2xl bg-white dark:bg-[#1a2236] border border-gray-200/80 dark:border-white/10 shadow-sm",
  adminTableHead:
    "border-b border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400",
  adminTableRow:
    "transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] group border-b border-gray-100 dark:border-white/5 text-gray-900 dark:text-slate-100",
  cardImageZoom:
    "[backface-visibility:hidden] [transform:translateZ(0)] object-cover transition-[scale,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] [will-change:scale,transform]",
  field:
    "w-full rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-slate-800 px-[0.9rem] py-[0.7rem] text-gray-900 dark:text-white transition-[border-color,box-shadow] duration-150 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgb(244_63_94/0.12)] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-900 disabled:text-gray-500 dark:disabled:text-slate-400",
  globalInteractions:
    "[&_:is(a,button,select,[role='button'],summary):not(:disabled)]:cursor-pointer [&_input:is([type='date'],[type='checkbox'],[type='radio'],[type='file']):not(:disabled)]:cursor-pointer [&_:is(a,button,select,[role='button'],summary):not(:disabled):not([class*='transition'])]:transition-[color,background-color,border-color,box-shadow,transform,opacity] [&_:is(a,button,select,[role='button'],summary):not(:disabled):not([class*='duration-'])]:duration-300 [&_:is(a,button,select,[role='button'],summary):not(:disabled):not([class*='ease-'])]:ease-out [&_:is(a,button,input,select,textarea):focus-visible]:outline-3 [&_:is(a,button,input,select,textarea):focus-visible]:outline-offset-2 [&_:is(a,button,input,select,textarea):focus-visible]:outline-rose-500/25",
  iconButton:
    "grid shrink-0 place-items-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-300 ease-out hover:scale-105 hover:border-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-35",
  locationImageSweep:
    "after:pointer-events-none after:absolute after:-inset-y-1/2 after:-left-1/2 after:z-10 after:w-1/3 after:rotate-12 after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:translate-x-0 after:transition-transform after:duration-1000 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:after:translate-x-[500%] group-hover:after:translate-x-[500%]",
  mobileSheetMotion:
    "transition-[opacity,translate] duration-300 ease-out starting:translate-y-5 starting:opacity-0",
  popoverMotion:
    "origin-top transition-[opacity,translate,scale] duration-200 ease-out starting:-translate-y-2 starting:scale-[0.98] starting:opacity-0",
  surface:
    "rounded-2xl border border-gray-200 bg-white/95 shadow-[0_10px_35px_rgb(15_23_42/0.06)] dark:border-white/10 dark:bg-[#1a2236] dark:shadow-[0_10px_35px_rgb(0_0_0/0.3)]",
} as const;

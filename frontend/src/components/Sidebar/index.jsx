import useUser from "@/hooks/useUser";
import { USER_BACKGROUND_COLOR } from "@/utils/constants";
import paths from "@/utils/paths";
import { List, Plus, UploadSimple } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Footer from "../Footer";
import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from "../Modals/NewWorkspace";
import SettingsButton from "../SettingsButton";
import ActiveWorkspaces from "./ActiveWorkspaces";
import UploadedDocuments from "./UploadDocuments";
import { useUploadedModel } from "./UploadDocuments/useUploadedModel";

export default function Sidebar() {
  const { user } = useUser();
  const { t } = useTranslation();
  const sidebarRef = useRef(null);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const {
    show: showingUploadModal,
    showUploadModal: showUploadedModal,
    hideUploadModal: hideUploadModal,
  } = useUploadedModel();

  return (
    <div>
      <Link
        to={paths.home()}
        className="flex shrink-0 max-w-[55%] items-center justify-start mx-[35px] my-[15px] gap-1"
        aria-label="Home"
      >
        <img
          src={"/logo.jpeg"}
          alt="Logo"
          className="rounded max-h-[36px] object-contain"
        />
        <h1 className="text-2xl font-medium text-white">OssorioIA</h1>
      </Link>
      <div
        ref={sidebarRef}
        className="relative m-[16px] rounded-[16px] bg-sidebar border-2 border-outline min-w-[250px] p-[10px] h-[calc(100%-76px)]"
      >
        <div className="flex flex-col h-full overflow-x-hidden">
          <div className="flex-grow flex flex-col min-w-[235px]">
            <div className="relative h-[calc(100%-60px)] flex flex-col w-full justify-between pt-[10px] overflow-y-scroll no-scroll">
              <div className="flex flex-col gap-y-2 pb-[60px] overflow-y-scroll no-scroll">
                <div className="flex gap-x-2 items-center justify-between">
                  {(!user || user?.role !== "default") && (
                    <button
                      onClick={showUploadedModal}
                      className="flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 bg-white rounded-[8px] text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
                    >
                      <UploadSimple size={18} weight="bold" />
                      <p className="text-sidebar text-sm font-semibold">
                        {t("dashboard.upload")}
                      </p>
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-x-2 items-center justify-center">
                  {(!user || user?.role !== "default") && (
                    <button
                      onClick={showNewWsModal}
                      className="flex flex-grow w-full h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 bg-white rounded-[8px] text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
                    >
                      <Plus size={18} weight="bold" />
                      <p className="text-sidebar text-sm font-semibold">
                        {t("dashboard.workspace")}
                      </p>
                    </button>
                  )}
                </div>
                <ActiveWorkspaces />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 pt-4 pb-3 rounded-b-[16px] bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md z-10">
              <Footer />
            </div>
          </div>
        </div>
      </div>
      {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      {showingUploadModal && <UploadedDocuments hideModal={hideUploadModal} />}
    </div>
  );
}

export function SidebarMobileHeader() {
  const { t } = useTranslation();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const {
    show: showingUploadModal,
    showUploadModal: showUploadedModal,
    hideUploadModal: hideUploadModal,
  } = useUploadedModel();
  const { user } = useUser();

  useEffect(() => {
    // Darkens the rest of the screen
    // when sidebar is open.
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-20 flex items-center px-4 py-2 bg-sidebar text-slate-200 shadow-lg h-16"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="rounded-md p-2 flex items-center justify-center text-slate-200"
        >
          <List className="h-6 w-6" />
        </button>
        <div className="flex gap-2 items-center mx-auto">
          <img
            src={"/logo.jpeg"}
            alt="Logo"
            className="block mx-auto h-6 w-auto"
            style={{ maxHeight: "20px", objectFit: "contain" }}
          />
          <h1 className="text-xl font-medium text-white">OssorioIA</h1>
        </div>
      </div>
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={`z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]`}
      >
        <div
          className={`${showBgOverlay
              ? "transition-all opacity-1"
              : "transition-none opacity-0"
            }  duration-500 fixed top-0 left-0 ${USER_BACKGROUND_COLOR} bg-opacity-75 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="h-[100vh] fixed top-0 left-0  rounded-r-[26px] bg-sidebar w-[80%] p-[18px] "
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden items-between">
            {/* Header Information */}
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="flex shrink-1 w-fit items-center justify-start">
                <img
                  src={"/logo.jpeg"}
                  alt="Logo"
                  className="rounded w-full max-h-[40px]"
                  style={{ objectFit: "contain" }}
                />
                <h1 className="text-2xl font-medium text-white">OssorioIA</h1>
              </div>
              {(!user || user?.role !== "default") && (
                <div className="flex gap-x-2 items-center text-slate-500 shink-0">
                  <SettingsButton />
                </div>
              )}
            </div>

            {/* Primary Body */}
            <div className="h-full flex flex-col w-full justify-between pt-4 ">
              <div className="h-auto md:sidebar-items">
                <div className=" flex flex-col gap-y-4 overflow-y-scroll no-scroll pb-[60px]">
                  <div className="flex gap-x-2 items-center justify-between">
                    {(!user || user?.role !== "default") && (
                      <button
                        onClick={showUploadedModal}
                        className="flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 bg-white rounded-[8px] text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
                      >
                        <UploadSimple size={18} weight="bold" />
                        <p className="text-sidebar text-sm font-semibold">
                          {t("dashboard.upload")}
                        </p>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-x-2 items-center justify-between">
                    {(!user || user?.role !== "default") && (
                      <button
                        onClick={showNewWsModal}
                        className="flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-4 bg-white rounded-lg text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300"
                      >
                        <Plus className="h-5 w-5" />
                        <p className="text-sidebar text-sm font-semibold">
                          {t("dashboard.workspace")}
                        </p>
                      </button>
                    )}
                  </div>
                  <ActiveWorkspaces />
                </div>
              </div>
              <div className="z-99 absolute bottom-0 left-0 right-0 pt-2 pb-6 rounded-br-[26px] bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md">
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
    </>
  );
}

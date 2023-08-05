import React, { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import Joyride, { Step } from "react-joyride";
import { Path, useLocation, useNavigate } from "react-router-dom";
import { CustomTrans } from "..";

const SiderGuide: React.ForwardRefRenderFunction<{ open: () => void }, {}> = (
  _props,
  ref
) => {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [initRoute, setInitRoute] = useState<Partial<Path>>({ pathname: "/" });
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useImperativeHandle(ref, () => ({
    open: () => setRun(true),
  }));

  const steps: Array<Step> = [
    {
      title: t("start_guide_title"),
      content: t("start_guide_content"),
      target: "body",
      placement: "center",
    },
    {
      title: t("installed_scripts"),
      content: t("guide_installed_scripts"),
      target: ".guide-script",
    },
    {
      content: <CustomTrans i18nKey="guide_script_list_content" />,
      target: "#script-list",
      title: t("guide_script_list_title"),
      placement: "auto",
    },
    {
      content: t("guide_script_list_enable_content"),
      target: ".script-enable",
      title: t("guide_script_list_enable_title"),
    },
    {
      content: t("guide_script_list_apply_to_run_status_content"),
      target: ".apply_to_run_status",
      title: t("guide_script_list_apply_to_run_status_title"),
    },
    {
      target: ".script_sort",
      title: t("guide_script_list_sort_title"),
      content: <CustomTrans i18nKey="guide_script_list_sort_content" />,
    },
    {
      target: ".tools",
      title: t("guide_tools_title"),
      content: t("guide_tools_content"),
      placement: "auto",
    },
    {
      target: ".tools .backup",
      title: t("guide_tools_backup_title"),
      content: t("guide_tools_backup_content"),
    },
    {
      target: ".setting",
      title: t("guide_setting_title"),
      content: t("guide_setting_content"),
      placement: "auto",
    },
    {
      target: ".setting .sync",
      title: t("guide_setting_sync_title"),
      content: t("guide_setting_sync_content"),
    },
  ];

  const gotoNavigate = (go: Partial<Path>) => {
    if (go.pathname !== location.pathname) {
      return navigate(go);
    }
    if (go.search !== location.search) {
      return navigate(go);
    }
    if (go.hash !== location.hash) {
      return navigate(go);
    }
    return true;
  };

  return (
    <Joyride
      callback={(data) => {
        console.log(data);
        if (
          data.action === "stop" ||
          data.action === "close" ||
          data.status === "finished"
        ) {
          setRun(false);
          setStepIndex(0);
          gotoNavigate(initRoute);
        } else if (data.action === "next" && data.lifecycle === "complete") {
          switch (data.index) {
            case 5:
              gotoNavigate({ pathname: "/tools" });
              break;
            case 7:
              gotoNavigate({ pathname: "/setting" });
              break;
            default:
              break;
          }
          setStepIndex(data.index + 1);
        } else if (data.action === "prev" && data.lifecycle === "complete") {
          setStepIndex(data.index - 1);
        } else if (data.action === "start" && data.lifecycle === "init") {
          gotoNavigate({ pathname: "/" });
          setInitRoute({
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          });
        }
      }}
      locale={{
        next: t("next"),
        skip: t("skip"),
        back: t("back"),
        last: t("last"),
      }}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      steps={steps}
      disableOverlayClose
      disableScrolling
      spotlightPadding={0}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
    />
  );
};

export default React.forwardRef(SiderGuide);
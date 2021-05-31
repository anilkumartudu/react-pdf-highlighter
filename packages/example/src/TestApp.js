import React, { useEffect, useState, useCallback } from "react";
// eslint-disable-next-line import/no-webpack-loader-syntax
import PDFWorker from "worker-loader!pdfjs-dist/lib/pdf.worker";

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
  setPdfWorker
} from "react-pdf-highlighter";

import testHighlights from "./test-highlights";

import Spinner from "./Spinner";
import Sidebar from "./Sidebar";

import "./style/App.css";

// import { useDropzone } from "react-dropzone";

setPdfWorker(PDFWorker);

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({ comment }) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const PRIMARY_PDF_URL = "https://arxiv.org/pdf/1708.08021.pdf";
const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480.pdf";

const searchParams = new URLSearchParams(document.location.search);

const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;

const TestApp = () => {
  const [url, setUrl] = useState(initialUrl);
  const [highlights, setHighlights] = useState(
    []
    // testHighlights[initialUrl] ? [...testHighlights[initialUrl]] : []
  );

  const resetHighlights = () => {
    setHighlights([]);
  };

  const toggleDocument = () => {
    const newUrl =
      url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;

    setUrl(newUrl);
    setHighlights(testHighlights[newUrl] ? [...testHighlights[newUrl]] : []);
  };

  let scrollViewerTo = highlight => {};

  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());

    if (highlight) {
      scrollViewerTo(highlight);
    }
  };

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash, false);
    return () =>
      window.removeEventListener(
        "hashchange",
        scrollToHighlightFromHash,
        false
      );
  }, []);

  const getHighlightById = id => {
    return highlights.find(highlight => highlight.id === id);
  };

  const addHighlight = highlight => {
    console.log("Saving highlight", highlight);

    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const updateHighlight = (highlightId, position, content) => {
    console.log("Updating highlight", highlightId, position, content);

    setHighlights(
      highlights.map(h => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest
            }
          : h;
      })
    );
  };

  // const onDrop = useCallback(acceptedFiles => {
  //   console.log({ acceptedFiles });
  //   // Do something with the files
  // }, []);

  // const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <PdfLoader url={"https://arxiv.org/pdf/1708.08021.pdf"}>
      {pdfDocument => {
        console.log({ pdfDocument });
        return (
          <PdfHighlighter pdfDocument={pdfDocument} highlights={highlights} />
        );
      }}
    </PdfLoader>
  );

  return (
    <div className="App" style={{ display: "flex", height: "100vh" }}>
      {/* <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p style={{ color: "black" }}>Drop the files here ...</p>
        ) : (
          <p style={{ color: "black" }}>
            Drag 'n' drop some files here, or click to select files
          </p>
        )}
      </div> */}
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        toggleDocument={toggleDocument}
      />
      <div
        style={{
          height: "100vh",
          width: "75vw",
          position: "relative"
        }}
      >
        <PdfLoader
          url={"https://arxiv.org/pdf/1708.08021.pdf"}
          beforeLoad={<Spinner />}
        >
          {pdfDocument => {
            console.log({ pdfDocument });
            return (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={event => event.altKey}
                onScrollChange={resetHash}
                pdfScaleValue="page-width"
                scrollRef={scrollTo => {
                  scrollViewerTo = scrollTo;

                  scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={comment => {
                      addHighlight({ content, position, comment });
                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      highlight={highlight}
                      onChange={boundingRect => {
                        updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={popupContent =>
                        setTip(highlight, highlight => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index}
                      children={component}
                    />
                  );
                }}
                highlights={highlights}
              />
            );
          }}
        </PdfLoader>
      </div>
    </div>
  );
};

export default TestApp;

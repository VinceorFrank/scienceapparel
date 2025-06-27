import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const MarkdownPage = ({ fileName, title }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/${fileName}`)
      .then((res) => {
        if (!res.ok) throw new Error("File not found");
        return res.text();
      })
      .then(setContent)
      .catch(() => setError("Could not load the checklist."));
  }, [fileName]);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <ReactMarkdown>{content}</ReactMarkdown>
      )}
    </div>
  );
};

export default MarkdownPage; 
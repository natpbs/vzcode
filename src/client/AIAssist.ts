import { EditorView, keymap } from '@codemirror/view';
import { json1Presence } from '../ot';
import {
  FileId,
  File,
  ShareDBDoc,
  VZCodeContent,
} from '../types';
import { generateRequestId } from './CodeEditor/typeScriptCompletions';

import { TabState } from './vzReducer';

const { insertOp, replaceOp } = json1Presence;

export const AIAssist = ({
  shareDBDoc,
  // The file id of the file the AI should assist with.
  fileId,
  tabList,
}: {
  shareDBDoc: ShareDBDoc<VZCodeContent>;
  fileId: string;
  aiAssistEndpoint: string;
  aiAssistOptions?: {
    [key: string]: any;
  };
  tabList: Array<TabState>;
}) =>
  keymap.of([
    {
      key: 'control-m',
      run: (view: EditorView) => {
        // if (
        //   shareDBDoc.data.aiStreams === undefined ||
        //   shareDBDoc.data.aiStreams[mostRecentStreamId] ===
        //     null ||
        //   shareDBDoc.data.aiStreams[mostRecentStreamId]
        //     ?.AIStreamStatus.serverIsRunning !== true
        // ) {
        startAIAssist({
          view,
          shareDBDoc,
          fileId,
          tabList,
        });
        // TODO handle stopping it
        // } else {
        //   haltAIAssist(shareDBDoc);
        // }

        return true;
      },
    },
  ]);
const defaultAIAssistEndpoint = '/ai-assist';

export const startAIAssist = async ({
  view,
  shareDBDoc,
  fileId,
  tabList,
  aiAssistEndpoint = defaultAIAssistEndpoint,
  aiAssistOptions = {},
}: {
  view: EditorView;
  shareDBDoc: ShareDBDoc<VZCodeContent>;
  fileId: FileId;
  tabList: Array<TabState>;
  aiAssistEndpoint?: string;
  aiAssistOptions?: {
    [key: string]: any;
  };
}) => {
  const inputText =
    (await generateFilesContext(
      tabList.map(
        (tabState) =>
          shareDBDoc.data.files[tabState.fileId],
      ),
    )) +
    'Current File:\n' +
    view.state.sliceDoc(0, view.state.selection.main.to);

  // console.log(textToSend);

  // TODO store this somewhere else
  let mostRecentStreamId = generateRequestId();

  // if (shareDBDoc.data['aiStreams'] === undefined) {
  //   shareDBDoc.submitOp(insertOp(['aiStreams'], {}), {
  //     source: 'AIClient',
  //   });
  // }

  // shareDBDoc.submitOp(
  //   insertOp(['aiStreams', mostRecentStreamId], {
  //     AIStreamStatus: {
  //       clientWantsToStart: true,
  //       serverIsRunning: false,
  //       text: textToSend,
  //       insertionCursor: view.state.selection.main.to,
  //       fileId: fileId,
  //     },
  //   }),
  //   { source: 'AIClient' },
  // );
  console.log('TODO startAIAssist');
  console.log('mostRecentStreamId', mostRecentStreamId);
  console.log('inputText', inputText);

  fetch(aiAssistEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Pass additional options to the AI Assist endpoint.
      ...aiAssistOptions,
      inputText,
      fileId,
      insertionCursor: view.state.selection.main.to,
    }),
  });
};

// export const haltAIAssist = (
//   shareDBDoc: ShareDBDoc<VZCodeContent>,
// ) => {
//   const haltGenerationOp = replaceOp(
//     [
//       'aiStreams',
//       mostRecentStreamId,
//       'AIStreamStatus',
//       'clientWantsToStart',
//     ],
//     true,
//     false,
//   );

//   shareDBDoc.submitOp(haltGenerationOp, {
//     source: 'AIClient',
//   });
// };

export const generateFilesContext = async (
  goodFiles: File[],
): Promise<string> => {
  const input = goodFiles
    .map((file) => {
      const nameSubstring = file.name
        // ?.substring(0, maxFileNameLength)
        .trim();

      const textSubstring = file.text
        // ?.substring(0, maxFileTextLength)
        .trim();

      // Generate Markdown that AI will understand.
      return `File \`${nameSubstring}\`:\n\`\`\`${textSubstring}\`\`\``;
    })
    .join('\n\n');

  return input;
};

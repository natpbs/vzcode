import {
  ViewPlugin,
  EditorView,
  WidgetType,
  Decoration,
} from '@codemirror/view';
import { Annotation, RangeSet } from '@codemirror/state';

// Deals with receiving the broadcasted presence cursor locations
// from other clients and displaying them.
//
// Inspired by
//  * https://github.com/yjs/y-codemirror.next/blob/main/src/y-remote-selections.js
//  * https://codemirror.net/examples/decoration/
//  * https://github.com/share/sharedb/blob/master/examples/rich-text-presence/client.js
//  * https://share.github.io/sharedb/presence
export const json1PresenceDisplay = ({
  path,
  docPresence,
}) => [
  ViewPlugin.fromClass(
    class {
      // The decorations to display.
      // This is a RangeSet of Decoration objects.
      // See https://codemirror.net/6/docs/ref/#view.Decoration
      decorations: RangeSet<Decoration>;

      constructor(view: EditorView) {
        // Initialize decorations to empty array so CodeMirror doesn't crash.
        this.decorations = RangeSet.of([]);

        // Mutable state local to this closure representing aggregated presence.
        //  * Keys are presence ids
        //  * Values are presence objects as defined by ot-json1-presence
        const presenceState = {};

        // Receive remote presence changes.
        docPresence.on('receive', (id, presence) => {
          // If presence === null, the user has disconnected / exited
          // notification(presence);
          // console.log('docPresence in presenceDisplay:',docPresence);
          // console.log('presence in presenceDisplay:', presence);

          // We also check if the presence is for the current file or not.
          if (presence && pathMatches(path, presence)) {
            presenceState[id] = presence;
          } else {
            delete presenceState[id];
          }
          // Update decorations to reflect new presence state.
          // TODO consider mutating this rather than recomputing it on each change.
          this.decorations = Decoration.set(
            Object.keys(presenceState).map((id) => {
              const presence = presenceState[id];
              const { start, end } = presence;
              const from = start[start.length - 1];
              // TODO support selection ranges (first attempt introduced layout errors)
              const to = end[end.length - 1];
              if (from === to) {
                return {
                  from,
                  to,
                  value: Decoration.widget({
                    side: -1,
                    block: false,
                    widget: new PresenceWidget(id),
                  }),
                };
              } else {
                return {
                  from,
                  to,
                  value: Decoration.mark({
                    class: 'cm-json1-presence',
                    attributes: {
                      style: `
                        background-color: rgba(255, 255, 0, 0.5);
                        box-shadow: 1px 0 0 yellow;
                        `,
                    },
                  }),
                };
              }
            }),
            // Without this argument, we get the following error:
            // Uncaught Error: Ranges must be added sorted by `from` position and `startSide`
            true,
          );

          // Somehow this triggers re-rendering of the Decorations.
          // Not sure if this is the correct usage of the API.
          // Inspired by https://github.com/yjs/y-codemirror.next/blob/main/src/y-remote-selections.js
          // Set timeout so that the current CodeMirror update finishes
          // before the next ones that render presence begin.
          setTimeout(() => {
            view.dispatch({
              annotations: [presenceAnnotation.of(true)],
            });
          }, 0);
        });
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  ),
  presenceTheme,
];

// const notification = (presence) => {
//   const notif = document.createElement('div');
//   notif.className = 'notification-presence';
//   if (presence === null){
//     notif.textContent = 'User asdfgasdfgasdfg left the collaboration session.';
//     notif.style.display = 'block';
//   }
//   // The following causes the popup to show every time the remote cursor moves
//   // to a different location on the file and not when the user first joins
//   // else {
//   //   notif.textContent = presence + 'joined the collaboration session.';
//   //   notif.style.display = 'block';
//   // }
//   document.body.appendChild(notif);

//   const notifStyle = document.createElement('style');
//   notifStyle.innerText = `
//     .notification-presence {
//       position: fixed;
//       display: none;
//       bottom: 20px;
//       right: 20px;
//       max-width: 300px;
//       overflow-x: hidden;
//       white-space: nowrap;
//       background-color: rgb(54, 65, 89);
//       color: rgb(154, 160, 172);
//       padding: 15px;
//     }
//     .notification-presence:hover {
//       overflow-x: auto;
//     }`;
//   document.head.appendChild(notifStyle);

//   setTimeout(() => {
//     notif.style.display = 'none';
//   }, 10000);

//   return notif;
// };

const presenceAnnotation = Annotation.define();

// Checks that the path of this file
// matches the path of the presence.
//  * If true is returned, the presence is in this file.
//  * If false is returned, the presence is in another file.
// Assumption: start and end path are the same except the cursor position.
const pathMatches = (path, presence) => {
  for (let i = 0; i < path.length; i++) {
    if (path[i] !== presence.start[i]) {
      return false;
    }
  }
  return true;
};

// Displays a single remote presence cursor.
class PresenceWidget extends WidgetType {
  id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }

  eq(other: PresenceWidget) {
    return other.id === this.id;
  }

  toDOM() {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.className = 'cm-json1-presence';

    // This child is what actually displays the presence.
    // Nested so that the layout is not impacted.
    //
    // The initial attempt using the top level span to render
    // the cursor caused a wonky layout with adjacent characters shifting
    // left and right by 1 pixel or so.
    span.appendChild(document.createElement('div'));
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

const presenceTheme = EditorView.baseTheme({
  '.cm-json1-presence': {
    position: 'relative',
  },
  '.cm-json1-presence > div': {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    borderLeft: '1px solid yellow',
  },
});
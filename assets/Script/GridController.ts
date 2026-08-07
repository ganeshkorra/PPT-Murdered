import { _decorator, Component, UIOpacity, instantiate, Size, Node, Vec2, Vec3, AudioClip, AudioSource, Color, SpriteFrame, Tween, Graphics, tween, v3, v2, Sprite, Event, director, Layout, UITransform, Label, CCInteger, Button, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;
import { Analytics, analyticsEvents } from "./Analytics";
import { CTAButtonHandler } from './CTAButtonHandler';
import { PersonClue } from './personclue';

@ccclass('GridController')
export class GridController extends Component {

    // --- UI ELEMENTS ---
    @property(Label)
    timerLabel: Label = null!;

    @property(Node)
    selectionMenu: Node = null!;

    @property(Node)
    associatedHint: Node = null!;

    @property(Node)
    hintContainer: Node = null!;

    @property(Node)
    decorationNode: Node = null!;

    @property(Node)
    placementDecorationNode: Node = null!;

    @property(Node)
    decorationPlacementNode: Node = null!;

    @property(Node)
    ctaEndScreen: Node = null!;

    @property(String)
    nextSceneName: string = "";

    @property(Node)
    introContainer: Node = null!;

    @property([Node])
    introCharacters: Node[] = [];

    @property(Node)
    introNormalCharacter: Node = null!;

    @property(Node)
    introCryCharacter: Node = null!;

    @property(Node)
    introBubble: Node = null!;

    // Assign your authored Canvas/Overlay node and its Glow child here.
    @property(Node)
    tutorialOverlay: Node = null!;

    @property(Node)
    tutorialGlow: Node = null!;

    @property(String)
    tutorialStartCell: string = ""; // e.g. "5" or "5,1" or "5/1" to target a specific grid node

    // @property(Label)
    // introBubbleLabel: Label = null!;

    @property(String)
    correctItemName: string = "";

    // The pill artwork used when a Year answer is placed in the grid.
    // Assign this only to the Year-row cells in the Inspector.
    @property(SpriteFrame)
    yearLabelBackground: SpriteFrame = null!;

    // --- FEEDBACK & LIVES ---
    @property([Sprite])
    heartSprites: Sprite[] = [];

    @property(SpriteFrame)
    brokenHeartFrame: SpriteFrame = null!;

    @property(Node)
    guideNode: Node = null!;

    @property(Node)
    handNode: Node = null!;

    @property(SpriteFrame)
    idleHandSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    clickHandSprite: SpriteFrame = null!;

    @property({ type: CCInteger })
    totalMatchesNeeded: number = 8;

    @property(Node)
    successRotationEffect: Node = null!;

    @property([Node])
    hiddenCluesToUnlock: Node[] = [];

    @property(SpriteFrame)
    bonusClueGraphic: SpriteFrame = null!;

    @property(Node)
    pinNode: Node = null!;

    @property([Node])
    extraHintsToClear: Node[] = [];

    @property([Node])
    extraRightNodes: Node[] = []; // NEW PROPERTY: Link right ticks for the extra hints here

    // --- STATIC STATE (GLOBAL TO ALL BOXES) ---
    private static currentMistakes: number = 0;
    private static activeBox: GridController | null = null;
    private static timerMaster: GridController | null = null;
    private static matchesMade: number = 0;

    private static globalTimerLabel: Label | null = null;
    private static remainingTime: number = 60;
    private static isTimerStarted: boolean = false;
    private static isGameOver: boolean = false;
    private static shouldSlideInNextScene: boolean = false;
    private static isIntroPlaying: boolean = false;
    private static hasIntroPlayed: boolean = false;
    private static hasStartupProcessed: boolean = false;
    private static hasGameStarted: boolean = false;

    private static idleTimer: number = 0;
    private static isHandShowing: boolean = false;
    private static initialHandScale: Vec3 = v3(1, 1, 1);
    private static hasShownFirstTapHand: boolean = false;
    // Tutorial-specific state: show hand on two cells in same column
    private static tutorialColumnKey: string | null = null;
    private static tutorialStep: number = 0; // 0 = off, 1 = first shown, 2 = second shown
    private static tutorialCurrentBox: GridController | null = null;
    // Sequence support: allow comma-separated list like "5,1,9" in `tutorialStartCell`
    private static tutorialSequence: string[] = [];
    private static tutorialSeqIndex: number = 0;
    private static tutorialRepeatTimes: number = 2; // how many times to show per node
    private static tutorialCurrentRepeat: number = 0;
    private readonly IDLE_THRESHOLD: number = 7;

    private static allBoxes: GridController[] = [];
    private static globalHandNode: Node | null = null;
    private static globalHandIdle: SpriteFrame | null = null;
    private static globalHandClick: SpriteFrame | null = null;
    private static openingTutorialOverlay: Node | null = null;
    private static openingTutorialGlow: Node | null = null;
    private static hintOriginalScales: Map<Node, Vec3> = new Map();
    private static completedItemNames: Set<string> = new Set();
    private static completedMenuItemKeys: Set<string> = new Set();
    private static completedColumnCounts: Map<string, number> = new Map();
    private static completedColumnDecorations: Set<string> = new Set();
    // Hint cards controlled by the bottom PersonClue components.
    private static personClueHints: Set<Node> = new Set();
    private static selectedPersonNode: Node | null = null;
    private static personOriginalScales: Map<Node, Vec3> = new Map();

    @property(AudioClip) bgmClip: AudioClip = null!;
    @property(AudioClip) clickBoxClip: AudioClip = null!;
    @property(AudioClip) winMatchClip: AudioClip = null!;
    @property(AudioClip) wrongMatchClip: AudioClip = null!;

    private static bgmSource: AudioSource = null!;
    private static fxSource: AudioSource = null!;

    private static globalCtaEndScreen: Node | null = null;
    private isSolved: boolean = false;

    @property(AudioClip)
    hintVoiceClip: AudioClip = null!;

    @property(Node)
    rightNode: Node = null!;

 @property(ProgressBar)
    selectionTimerBar: ProgressBar = null!;

    // @property(CCInteger)
    // menuTimerDuration: number = 3; // Time in seconds for the bar to empty
    // // Inside GridController class
@property(ProgressBar)
highlightBar: ProgressBar = null!; // Link this to the 'Highlight Text' node in each Box's Inspector


@property(Boolean)
    enableTapTriggerCTA: boolean = false; // Toggle this ON in Inspector to enable

    @property(CCInteger)
    maxTapsBeforeCTA: number = 5; // Set the number of taps here (2, 3, 4, etc)

    private static globalUserTapCount: number = 0; // The actual counter



    private static isChallengeStarted: boolean = false;
    private static hasPassed25: boolean = false;
    private static hasPassed50: boolean = false;
    private static hasPassed75: boolean = false;


    private originalGridScale: Vec3 = v3(1, 1, 1);
    private originalHintScale: Vec3 = v3(0.565, 0.565, 0.565);
    private hintDesignSize: { width: number, height: number } = { width: 0, height: 0 };
    private originalMenuItemScale: Vec3 = v3(1, 1, 1);
    private originalSelectionMenuScale: Vec3 = v3(1, 1, 1);
    private originalSelectionMenuSize: Size = new Size(0, 0);
    private designScale: Vec3 = v3(1, 1, 1);
    private designSize: { width: number, height: number } = { width: 0, height: 0 };
    private selectedFrameNode: Node | null = null;
    private decorationDesignScale: Vec3 = v3(1, 1, 1);
    private decorationDesignSize: { width: number, height: number } = { width: 0, height: 0 };
    private decorOriginalScale: Vec3 = v3(1, 1, 1);
    private decorOriginalSize: { width: number, height: number } = { width: 0, height: 0 };
    private decorOriginalPosition: Vec3 = v3(0, 0, 0);
    private placementDecorOriginalScale: Vec3 = v3(1, 1, 1);
    private placementDecorOriginalSize: { width: number, height: number } = { width: 0, height: 0 };
    private decorationPlacementOriginalScale: Vec3 = v3(1, 1, 1);
    private introBubbleTextPosition: Vec3 | null = null;
    private menuItemScales: Map<string, Vec3> = new Map();
    private menuItemVisuals: Map<Node, Node> = new Map();
    private menuItemVisualOffsets: Map<Node, Vec3> = new Map();
    private menuItemVisualScales: Map<Node, Vec3> = new Map();
    private menuDesignScale: Vec3 = v3(1, 1, 1);
    private targetScale: Vec3 = v3(1, 1, 1);
    private targetSize: { width: number, height: number } = { width: 0, height: 0 };

    private getItemSpriteFrame(item: Node): SpriteFrame | null {
        return item.getComponent(Sprite)?.spriteFrame || null;
    }

    private getAssignedItemIdentity(item: Node | null): string {
        if (!item?.isValid) return "";

        const directName = item.name?.trim() || "";
        if (directName) return directName;

        const candidateNames = ["ItemName", "itemName", "AssignedName", "assignedName", "Identity", "identity", "Value", "value"];
        for (const candidateName of candidateNames) {
            const child = item.getChildByName(candidateName);
            if (!child?.isValid) continue;

            const label = child.getComponent(Label);
            if (label?.string?.trim()) return label.string.trim();

            const childName = child.name?.trim();
            if (childName) return childName;
        }

        const label = item.getComponent(Label);
        if (label?.string?.trim()) return label.string.trim();

        return "";
    }

    private getSpriteKey(spriteFrame: SpriteFrame | null): string {
        if (!spriteFrame) return "";

        const asset = spriteFrame as any;
        return asset.uuid || asset._uuid || asset.name || "";
    }

    private getSelectionMenuGroupKey(): string {
        if (!this.selectionMenu) return "";

        return this.getSelectionMenuItems()
            .map(item => this.getSpriteKey(this.getItemSpriteFrame(item)))
            .filter(key => key.length > 0)
            .sort()
            .join("|");
    }

    private getSelectionMenuItems(): Node[] {
        if (!this.selectionMenu) return [];

        return this.selectionMenu.children.filter(item => !!item.getComponent(Button));
    }

    /** Called by PersonClue during setup. GridController owns clue visibility. */
    public registerPersonClues(clues: Node[]) {
        clues.forEach(clue => {
            if (!clue?.isValid) return;
            GridController.personClueHints.add(clue);
            clue.active = false;
        });
    }

    /** Shows exactly one person clue and hides every other registered person clue. */
    public showPersonClue(clue: Node, personNode: Node | null = null) {
        if (!clue?.isValid) return;

        GridController.personClueHints.forEach(personClue => {
            if (personClue?.isValid) {
                Tween.stopAllByTarget(personClue);
                personClue.active = false;
            }
        });

        const clueScale = this.getHintOriginalScale(clue);
        const clueOpacity = clue.getComponent(UIOpacity) || clue.addComponent(UIOpacity);
        clue.active = true;
        clue.setScale(v3(clueScale.x * 0.97, clueScale.y * 0.97, clueScale.z));
        clueOpacity.opacity = 0;
        Tween.stopAllByTarget(clue);
        tween(clue)
            .to(0.22, { scale: clueScale }, { easing: 'sineOut' })
            .call(() => {
                tween(clue)
                    .repeatForever(
                        tween()
                            .to(0.7, { scale: v3(clueScale.x * 1.025, clueScale.y * 1.025, clueScale.z) }, { easing: 'sineInOut' })
                            .to(0.7, { scale: clueScale }, { easing: 'sineInOut' })
                    )
                    .start();
            })
            .start();
        tween(clueOpacity).to(0.2, { opacity: 255 }, { easing: 'sineOut' }).start();

        if (personNode?.isValid) {
            const previousPerson = GridController.selectedPersonNode;
            if (previousPerson?.isValid && previousPerson !== personNode) {
                const previousScale = GridController.personOriginalScales.get(previousPerson) || previousPerson.scale.clone();
                Tween.stopAllByTarget(previousPerson);
                tween(previousPerson)
                    .to(0.18, { scale: previousScale }, { easing: 'sineOut' })
                    .start();
            }

            let personScale = GridController.personOriginalScales.get(personNode);
            if (!personScale) {
                personScale = personNode.scale.clone();
                GridController.personOriginalScales.set(personNode, personScale);
            }
            const selectedScale = v3(personScale.x * 1.12, personScale.y * 1.12, personScale.z);
            Tween.stopAllByTarget(personNode);
            tween(personNode)
                .to(0.2, { scale: v3(personScale.x * 1.16, personScale.y * 1.16, personScale.z) }, { easing: 'sineOut' })
                .to(0.26, { scale: selectedScale }, { easing: 'sineInOut' })
                .start();
            GridController.selectedPersonNode = personNode;
        }
        GridController.idleTimer = 0;
    }

    private cacheSelectionMenuVisuals() {
        if (!this.selectionMenu) return;

        this.menuItemVisuals.clear();
        this.menuItemVisualOffsets.clear();
        this.menuItemVisualScales.clear();

        let pendingVisual: Node | null = null;
        this.selectionMenu.children.forEach(child => {
            if (child.getComponent(Button)) {
                if (pendingVisual) {
                    this.menuItemVisuals.set(child, pendingVisual);
                    this.menuItemVisualOffsets.set(child, child.position.clone().subtract(pendingVisual.position));
                    this.menuItemVisualScales.set(child, pendingVisual.scale.clone());
                    pendingVisual = null;
                }
                return;
            }

            if (child.getComponent(UITransform) && !child.getComponent(ProgressBar)) {
                pendingVisual = child;
            }
        });
    }

    private getMenuItemCompletionKey(item: Node): string {
        return this.getAssignedItemIdentity(item)
            || this.getSpriteKey(this.getItemSpriteFrame(item))
            || item.name || "";
    }

    private getColumnKey(): string {
        const localX = this.node.position ? this.node.position.x : this.node.worldPosition.x;
        const snappedX = Math.round(localX / 50) * 50;
        return `${snappedX}`;
    }

    private static incrementColumnCompletion(columnKey: string): number {
        const current = GridController.completedColumnCounts.get(columnKey) || 0;
        const next = current + 1;
        GridController.completedColumnCounts.set(columnKey, next);
        return next;
    }

    private getColumnSize(columnKey: string): number {
        return GridController.allBoxes.filter(box => box.getColumnKey() === columnKey).length;
    }

    private revealDecorationForPlacedItem() {
        if (!this.decorationNode?.isValid) return;

        Tween.stopAllByTarget(this.decorationNode);
        this.decorationNode.active = true;

        const decTrans = this.decorationNode.getComponent(UITransform);
        if (decTrans) {
            decTrans.setContentSize(this.decorOriginalSize.width, this.decorOriginalSize.height);
        }

        this.decorationNode.setScale(this.decorOriginalScale);
    }

    /** Mirrors the reference game's persistent, soft-green solved-cell state. */
    private showSolvedCellHighlight() {
        const cellTransform = this.node.getComponent(UITransform);
        if (!cellTransform) return;

        let highlight = this.node.getChildByName("SolvedCellHighlight");
        if (!highlight) {
            highlight = new Node("SolvedCellHighlight");
            this.node.addChild(highlight);
            highlight.addComponent(UITransform).setContentSize(cellTransform.contentSize);

            const graphics = highlight.addComponent(Graphics);
            const { width, height } = cellTransform.contentSize;
            graphics.fillColor = new Color(194, 247, 182, 155);
            graphics.rect(-width / 2, -height / 2, width, height);
            graphics.fill();

            // It must sit behind the placed answer and any existing cell art.
            highlight.setSiblingIndex(0);
        }

        const opacity = highlight.getComponent(UIOpacity) || highlight.addComponent(UIOpacity);
        Tween.stopAllByTarget(highlight);
        Tween.stopAllByTarget(opacity);
        highlight.active = true;
        highlight.setScale(v3(0.84, 0.84, 1));
        opacity.opacity = 0;
        tween(highlight).to(0.24, { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
        tween(opacity).to(0.18, { opacity: 255 }).start();
    }

    private showOpeningTutorialOverlay() {
        const overlay = GridController.openingTutorialOverlay
            || director.getScene()?.getChildByPath("Canvas/Overlay")
            || null;
        if (!overlay?.isValid) return;

        GridController.openingTutorialOverlay = overlay;

        const opacity = overlay.getComponent(UIOpacity) || overlay.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        overlay.active = true;
        opacity.opacity = 0;
        tween(opacity).to(0.22, { opacity: 255 }).start();

        const glow = GridController.openingTutorialGlow || overlay.getChildByName("Glow");
        if (!glow?.isValid) return;

        GridController.openingTutorialGlow = glow;
        Tween.stopAllByTarget(glow);

        const baseScale = glow.scale.clone();
        const glowOpacity = glow.getComponent(UIOpacity) || glow.addComponent(UIOpacity);
        Tween.stopAllByTarget(glowOpacity);

        glow.active = true;
        glow.setScale(baseScale);
        glowOpacity.opacity = 0;

        tween(glowOpacity)
            .repeatForever(
                tween()
                    .to(0.65, { opacity: 255 }, { easing: 'sineInOut' })
                    .to(0.65, { opacity: 125 }, { easing: 'sineInOut' })
            )
            .start();
    }

    private hideOpeningTutorialOverlay() {
        const overlay = GridController.openingTutorialOverlay;
        if (!overlay?.isValid || !overlay.active) return;

        const opacity = overlay.getComponent(UIOpacity) || overlay.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        if (GridController.openingTutorialGlow?.isValid) {
            const glowOpacity = GridController.openingTutorialGlow.getComponent(UIOpacity);
            if (glowOpacity) {
                Tween.stopAllByTarget(glowOpacity);
                glowOpacity.opacity = 0;
            }
            Tween.stopAllByTarget(GridController.openingTutorialGlow);
        }
        tween(opacity).to(0.18, { opacity: 0 }).call(() => {
            if (overlay?.isValid) overlay.active = false;
        }).start();
    }

    private hideDecorationPlacementNodes() {
        if (this.placementDecorationNode?.isValid) {
            Tween.stopAllByTarget(this.placementDecorationNode);
            this.placementDecorationNode.active = false;
        }

        if (this.decorationPlacementNode?.isValid) {
            Tween.stopAllByTarget(this.decorationPlacementNode);
            this.decorationPlacementNode.active = false;
        }
    }

    private revealPlacementDecoration() {
        if (!this.placementDecorationNode?.isValid) return;

        Tween.stopAllByTarget(this.placementDecorationNode);
        this.placementDecorationNode.active = true;

        const placementTrans = this.placementDecorationNode.getComponent(UITransform);
        if (placementTrans) {
            placementTrans.setContentSize(this.placementDecorOriginalSize.width, this.placementDecorOriginalSize.height);
        }

        this.placementDecorationNode.setScale(v3(0, 0, 0));
        tween(this.placementDecorationNode)
            .to(0.25, { scale: this.placementDecorOriginalScale }, { easing: 'backOut' })
            .start();
    }

    private revealDecorationPlacement() {
        if (!this.decorationPlacementNode?.isValid) return;

        Tween.stopAllByTarget(this.decorationPlacementNode);
        this.decorationPlacementNode.active = true;
    }

    private hidePlacementDecoration() {
        if (!this.placementDecorationNode?.isValid) return;

        Tween.stopAllByTarget(this.placementDecorationNode);
        this.placementDecorationNode.active = false;
    }

    private playColumnCompletionDecorationTransition() {
        const placementNode = this.placementDecorationNode?.isValid ? this.placementDecorationNode : null;
        const finalNode = this.decorationPlacementNode?.isValid ? this.decorationPlacementNode : null;

        const showFinalDecoration = () => {
            if (!finalNode) return;

            const finalOpacity = finalNode.getComponent(UIOpacity) || finalNode.addComponent(UIOpacity);
            Tween.stopAllByTarget(finalNode);
            Tween.stopAllByTarget(finalOpacity);
            finalNode.active = true;
            finalNode.setScale(v3(
                this.decorationPlacementOriginalScale.x * 0.7,
                this.decorationPlacementOriginalScale.y * 0.7,
                this.decorationPlacementOriginalScale.z
            ));
            finalOpacity.opacity = 0;

            tween(finalNode)
                .to(0.28, { scale: this.decorationPlacementOriginalScale }, { easing: 'backOut' })
                .start();
            tween(finalOpacity).to(0.2, { opacity: 255 }).start();
        };

        if (!placementNode) {
            showFinalDecoration();
            return;
        }

        const placementOpacity = placementNode.getComponent(UIOpacity) || placementNode.addComponent(UIOpacity);
        Tween.stopAllByTarget(placementNode);
        Tween.stopAllByTarget(placementOpacity);
        placementOpacity.opacity = 255;

        tween(placementOpacity).to(0.2, { opacity: 0 }).start();
        tween(placementNode).to(0.2, {
            scale: v3(
                this.placementDecorOriginalScale.x * 0.85,
                this.placementDecorOriginalScale.y * 0.85,
                this.placementDecorOriginalScale.z
            )
        }).call(() => {
            placementNode.active = false;
            placementNode.setScale(this.placementDecorOriginalScale);
            placementOpacity.opacity = 255;
            showFinalDecoration();
        }).start();
    }

    private showColumnCompletionDecoration(columnKey: string) {
        const solvedBoxes = GridController.allBoxes.filter(box => box.isSolved && box.getColumnKey() === columnKey);
        solvedBoxes.forEach(box => {
            // A cell's placement decoration is shown as soon as that cell is solved.
            // Once the column is complete, replace it with the final decoration.
            box.playColumnCompletionDecorationTransition();

            if (!box.decorationNode?.isValid) return;

            Tween.stopAllByTarget(box.decorationNode);
            box.decorationNode.active = true;

            const decTrans = box.decorationNode.getComponent(UITransform);
            if (decTrans) {
                decTrans.setContentSize(box.decorOriginalSize.width, box.decorOriginalSize.height);
            }

            const targetNode = box.decorationPlacementNode?.isValid ? box.decorationPlacementNode : null;
            const targetWorldPos = targetNode ? targetNode.worldPosition.clone() : box.decorationNode.worldPosition.clone();
            const targetScale = targetNode ? targetNode.scale.clone() : box.decorOriginalScale.clone();
            const startWorldPos = box.decorationNode.worldPosition.clone();


            if (targetNode) {
                tween(box.decorationNode)
                    .to(0.7, { worldPosition: targetWorldPos, scale: targetScale }, { easing: 'cubicOut' })
                    .call(() => {
                        box.decorationNode.setWorldPosition(targetWorldPos);
                        box.decorationNode.setScale(targetScale);
                    })
                    .start();
            } else {
                box.decorationNode.setScale(box.decorOriginalScale);
            }
        });
    }

    private isMenuItemCompleted(item: Node): boolean {
        const itemKey = this.getMenuItemCompletionKey(item);
        if (itemKey && GridController.completedMenuItemKeys.has(itemKey)) return true;
        return !itemKey && item.name && GridController.completedItemNames.has(item.name);
    }


    private refreshSelectionMenuItems() {
        if (!this.selectionMenu) return;

        const visibleItems: Node[] = [];
        this.getSelectionMenuItems().forEach(item => {
            const isCompleted = this.isMenuItemCompleted(item);
            const savedScale = this.menuItemScales.get(item.name) || item.scale.clone();
            Tween.stopAllByTarget(item);
            item.active = !isCompleted;
            item.setScale(savedScale);

            const visual = this.menuItemVisuals.get(item);
            if (visual) {
                Tween.stopAllByTarget(visual);
                visual.active = !isCompleted;
                visual.setScale(this.menuItemVisualScales.get(item) || visual.scale);
            }

            const button = item.getComponent(Button);
            if (button) button.interactable = !isCompleted;
            if (!isCompleted) visibleItems.push(item);
        });

        this.fitSelectionMenuToItems(visibleItems);
    }

    private static markItemCompleted(itemName: string, itemKey: string) {
        if (!itemName && !itemKey) return;

        if (itemName) GridController.completedItemNames.add(itemName);
        if (itemKey) GridController.completedMenuItemKeys.add(itemKey);
        GridController.allBoxes.forEach(box => box.refreshSelectionMenuItems());
    }

    private fitSelectionMenuToItems(visibleItems: Node[]) {
        if (!this.selectionMenu || visibleItems.length === 0) return;

        const menuTrans = this.selectionMenu.getComponent(UITransform);
        if (!menuTrans) return;

        const itemGap = 54;
        const horizontalPadding = 8;
        const verticalPadding = 4;
        let itemsWidth = 0;
        let maxItemHeight = 0;

        visibleItems.forEach((item, index) => {
            const visual = this.menuItemVisuals.get(item) || item;
            const visualTrans = visual.getComponent(UITransform);
            const visualScale = this.menuItemVisualScales.get(item) || visual.scale;
            const visualWidth = visualTrans ? visualTrans.contentSize.width * Math.abs(visualScale.x) : 120;
            const visualHeight = visualTrans ? visualTrans.contentSize.height * Math.abs(visualScale.y) : 120;
            itemsWidth += visualWidth + (index > 0 ? itemGap : 0);
            maxItemHeight = Math.max(maxItemHeight, visualHeight);
        });

        const dynamicMinWidth = visibleItems.length === 1 ? 150 : visibleItems.length === 2 ? 300 : 450;
        const authoredWidth = this.originalSelectionMenuSize.width || menuTrans.contentSize.width;
        const authoredHeight = this.originalSelectionMenuSize.height || menuTrans.contentSize.height;
        const minWidth = visibleItems.length >= 3 ? Math.max(dynamicMinWidth, authoredWidth) : dynamicMinWidth;
        const width = Math.max(minWidth, itemsWidth + horizontalPadding);
        const minHeight = visibleItems.length >= 3 ? Math.max(358, authoredHeight) : 358;
        const height = Math.max(minHeight, maxItemHeight + verticalPadding);
        menuTrans.setContentSize(width, height);

        const anchor = menuTrans.anchorPoint;
        const contentCenterX = width * (0.5 - anchor.x);
        const contentCenterY = height * (0.5 - anchor.y);
        const itemLayoutY = contentCenterY - 45;
        let cursorX = -itemsWidth / 2;
        visibleItems.forEach(item => {
            const visual = this.menuItemVisuals.get(item) || item;
            const visualTrans = visual.getComponent(UITransform);
            const visualScale = this.menuItemVisualScales.get(item) || visual.scale;
            const visualWidth = visualTrans ? visualTrans.contentSize.width * Math.abs(visualScale.x) : 120;
            const visualX = contentCenterX + cursorX + visualWidth / 2;
            visual.setPosition(v3(visualX, itemLayoutY, 0));

            const offset = this.menuItemVisualOffsets.get(item) || v3(0, 15, 0);
            item.setPosition(v3(visualX + offset.x, itemLayoutY + offset.y, 0));
            item.setSiblingIndex(visual.getSiblingIndex() + 1);
            cursorX += visualWidth + itemGap;
        });
    }


    private checkTapProgress() {
        if (!this.enableTapTriggerCTA || GridController.isGameOver) return;

        GridController.globalUserTapCount++;
        console.log(`[USER TAPS] ${GridController.globalUserTapCount} / ${this.maxTapsBeforeCTA}`);

        if (GridController.globalUserTapCount >= this.maxTapsBeforeCTA) {
            console.warn("[CTA TRIGGER] Tap limit reached. Sending user to End Screen.");
            this.handleGameOver("TAP_LIMIT");
        }
    }



    start() {
        // Fire LOADED → DISPLAYED sequence when game first loads (only once)
        if (GridController.allBoxes.length === 0) {
            GridController.completedItemNames.clear();
            GridController.completedMenuItemKeys.clear();
            GridController.completedColumnCounts.clear();
            GridController.completedColumnDecorations.clear();
            GridController.currentMistakes = 0;
            GridController.matchesMade = 0;
            GridController.activeBox = null;
            GridController.timerMaster = null;
            GridController.remainingTime = 60;
            GridController.isTimerStarted = false;
            GridController.isGameOver = false;
            GridController.isIntroPlaying = false;
            GridController.hasIntroPlayed = false;
            GridController.hasStartupProcessed = false;
            GridController.hasGameStarted = false;
            GridController.idleTimer = 0;
            GridController.isHandShowing = false;
            GridController.hasShownFirstTapHand = false;
            GridController.tutorialColumnKey = null;
            GridController.tutorialStep = 0;
            GridController.tutorialCurrentBox = null;
            GridController.tutorialSequence = [];
            GridController.tutorialSeqIndex = 0;
            GridController.tutorialCurrentRepeat = 0;
            // These references belong to the previous scene and are invalid after a load.
            GridController.globalTimerLabel = null;
            GridController.globalHandNode = null;
            GridController.openingTutorialOverlay = null;
            GridController.openingTutorialGlow = null;
            GridController.globalCtaEndScreen = null;
            GridController.bgmSource = null!;
            GridController.fxSource = null!;
            GridController.globalUserTapCount = 0;
            GridController.hasPassed25 = false;
            GridController.hasPassed50 = false;
            GridController.hasPassed75 = false;
            if (Analytics.instance) {
                // 1. Fire LOADED first to signal assets are ready
                Analytics.instance.dispatchEvent(analyticsEvents.LOADED);
                console.log("[Analytics] LOADED event fired");
                
                // 2. Fire DISPLAYED after LOADED
                Analytics.instance.dispatchEvent(analyticsEvents.DISPLAYED);
                console.log("[Analytics] DISPLAYED event fired on game load");
            }
        }

        this.originalGridScale = this.node.scale.clone();
        this.designScale = this.node.scale.clone();
        const uiTrans = this.node.getComponent(UITransform);
        if (uiTrans) {
            this.designSize = { width: uiTrans.contentSize.width, height: uiTrans.contentSize.height };
        }
        this.targetScale = this.node.scale.clone();
        if (uiTrans) {
            this.targetSize = { width: uiTrans.contentSize.width, height: uiTrans.contentSize.height };
        }
        if (this.associatedHint) {
            this.originalHintScale = this.associatedHint.scale.clone();
            const hintTrans = this.associatedHint.getComponent(UITransform);
            if (hintTrans) {
                this.hintDesignSize = { width: hintTrans.contentSize.width, height: hintTrans.contentSize.height };
            }
        }
        this.cacheHintOriginalScales();
        if (this.selectionMenu) {
            this.menuDesignScale = this.selectionMenu.scale.clone();
            this.originalSelectionMenuScale = this.selectionMenu.scale.clone();
            const menuTrans = this.selectionMenu.getComponent(UITransform);
            if (menuTrans) this.originalSelectionMenuSize = new Size(menuTrans.contentSize.width, menuTrans.contentSize.height);
            this.cacheSelectionMenuVisuals();
            const menuItems = this.getSelectionMenuItems();
            menuItems.forEach(child => {
                this.menuItemScales.set(child.name, child.scale.clone());
            });
            if (menuItems.length > 0) {
                this.originalMenuItemScale = menuItems[0].scale.clone();
            }
            this.selectionMenu.active = false;
        }

        if (this.decorationNode) {
            this.decorOriginalScale = this.decorationNode.scale.clone();
            const uiTrans = this.decorationNode.getComponent(UITransform);
            if (uiTrans) {
                this.decorOriginalSize = { width: uiTrans.contentSize.width, height: uiTrans.contentSize.height };
            }
            this.decorationNode.active = false;
        }

        if (this.placementDecorationNode) {
            this.placementDecorOriginalScale = this.placementDecorationNode.scale.clone();
            const placementTrans = this.placementDecorationNode.getComponent(UITransform);
            if (placementTrans) {
                this.placementDecorOriginalSize = { width: placementTrans.contentSize.width, height: placementTrans.contentSize.height };
            }
            // Show the placement decoration from the start of the game.
            this.placementDecorationNode.active = true;
        }

        if (this.decorationPlacementNode) {
            this.decorationPlacementOriginalScale = this.decorationPlacementNode.scale.clone();
            this.decorationPlacementNode.active = false;
        }

        // Right marks stay hidden until their related hint has been completed.
        if (this.rightNode?.isValid) this.rightNode.active = false;
        this.extraRightNodes.forEach(mark => {
            if (mark?.isValid) mark.active = false;
        });

        const isFirstBox = GridController.allBoxes.length === 0;
        GridController.allBoxes.push(this);
        if (isFirstBox && !GridController.hasStartupProcessed) {
            GridController.hasStartupProcessed = true;
            this.scheduleOnce(() => this.performStartupSequence(), 0);
        }
        if (GridController.timerMaster === null) GridController.timerMaster = this;
        if (this.ctaEndScreen) {
            GridController.globalCtaEndScreen = this.ctaEndScreen;
            this.ctaEndScreen.active = false;
        }
        if (!GridController.bgmSource) {
            GridController.bgmSource = this.node.addComponent(AudioSource);
        }
        if (!GridController.fxSource) {
            GridController.fxSource = this.node.addComponent(AudioSource);
        }

        if (GridController.shouldSlideInNextScene) {
            GridController.shouldSlideInNextScene = false;
            this.slideInScene();
        }
        if (this.handNode) {
            GridController.globalHandNode = this.handNode;
            GridController.initialHandScale = this.handNode.scale.clone();
            GridController.globalHandNode.active = false;
        }
        if (this.idleHandSprite) GridController.globalHandIdle = this.idleHandSprite;
        if (this.clickHandSprite) GridController.globalHandClick = this.clickHandSprite;
        if (this.timerLabel) {
            GridController.globalTimerLabel = this.timerLabel;
            GridController.globalTimerLabel.string = `Time: 60`;
        }
        if (this.selectionMenu) this.selectionMenu.active = false;
        if (this.decorationNode) this.decorationNode.active = false;
        if (this.introContainer && !GridController.isIntroPlaying) {
            this.introContainer.active = false;
            const introOpacity = this.introContainer.getComponent(UIOpacity);
            if (introOpacity) introOpacity.opacity = 0;
        }
        if (this.handNode) {
            GridController.initialHandScale = this.handNode.scale.clone();
            this.handNode.active = false;
        }
        if (this.tutorialOverlay?.isValid) {
            GridController.openingTutorialOverlay = this.tutorialOverlay;
            this.tutorialOverlay.active = false;
        }
        if (this.tutorialGlow?.isValid) GridController.openingTutorialGlow = this.tutorialGlow;
        if (this.guideNode) {
            this.guideNode.active = false;
            this.guideNode.setScale(v3(0, 0, 0));
        }
    }

   update(dt: number) {
    if (GridController.timerMaster !== this) return;
    if (GridController.isTimerStarted && !GridController.isGameOver) {
        GridController.remainingTime -= dt;
        if (GridController.globalTimerLabel) {
            const displayTime = Math.max(0, Math.ceil(GridController.remainingTime));
            GridController.globalTimerLabel.string = `Time: ${displayTime}`;
        }
        if (GridController.remainingTime <= 0) {
            this.handleGameOver("TIME OUT");
        }
        GridController.idleTimer += dt;

        if (GridController.idleTimer >= this.IDLE_THRESHOLD && !GridController.isHandShowing) {
            if (GridController.activeBox && GridController.activeBox.selectionMenu.active) {
                GridController.activeBox.showHandOnCorrectMenuItem();
                GridController.activeBox.applyPulse(GridController.activeBox.node, true);
            }
            else {
                // --- SMART TARGET SEARCH ---
                const targetBox = GridController.allBoxes.find(box => {
                    if (box.isSolved) return false; // Skip solved boxes

                    // Logic: A box is valid if:
                    // 1. It has an active hint currently visible
                    const hasActiveHint = (box.associatedHint && box.associatedHint.active);
                    
                    // 2. OR it has NO hint but HAS items in the reveal list (Progress blocks)
                    const hasHiddenClues = (box.hiddenCluesToUnlock.length > 0 && !box.associatedHint);
                    
                    return hasActiveHint || hasHiddenClues;
                });

                if (targetBox) {
                    targetBox.showIdleHint();
                } else {
                    GridController.idleTimer = 0;
                }
            }
        }
    }
}

   private runEntrySequence() {
    // Only animate boxes that are NOT already solved (useful if restarting)
    const boxesToBlink = GridController.allBoxes
        .filter(box => !box.isSolved)
        .sort((a, b) => {
            // Sort by node name (assuming 1, 2, 3...)
            const aNum = parseInt(a.node.name) || 0;
            const bNum = parseInt(b.node.name) || 0;
            return aNum - bNum;
        });

    const blinkInterval = 0; // Fast, sequential ripple

    boxesToBlink.forEach((box, index) => {
        this.scheduleOnce(() => {
            if (box.node?.isValid) {
                // box.showEntryBlink(box.node);
            }
        }, index * blinkInterval);
    });

    // Show tutorial items (Hand/Dotted frame) AFTER all blinks are finished
    const totalTime = (boxesToBlink.length * blinkInterval) + 0;
    this.scheduleOnce(() => {
        const firstBox = GridController.allBoxes.find(b => b.node.name === "1") || boxesToBlink[0];
        if (firstBox && !firstBox.isSolved) {
            firstBox.showInitialTutorial(); 
        }
    }, totalTime);
}

    private showIntroSequence() {
        if (!this.introContainer) return;

        GridController.isIntroPlaying = true;
        this.introContainer.active = true;
        Tween.stopAllByTarget(this.introContainer);

        let introOpacity = this.introContainer.getComponent(UIOpacity);
        if (!introOpacity) {
            introOpacity = this.introContainer.addComponent(UIOpacity);
        }
        introOpacity.opacity = 0;

        GridController.hasIntroPlayed = true;
        tween(introOpacity)
            .to(0.8, { opacity: 255 }, { easing: 'linear' })
            .start();

        this.scheduleOnce(() => {
            this.setupIntroEmotionState();
            this.animateIntroCharacters();
            this.scheduleOnce(() => this.switchToCryIntro(), 0.0);
            this.scheduleOnce(() => this.hideIntroAndStartGame(), 3);
        }, 0);
    }

    private getIntroBubbleTextNode(): Node | null {
        if (!this.introBubble?.isValid) return null;
        if (this.introBubble.getComponent(Label)) return this.introBubble;

        return this.introBubble.children.find(child => child?.isValid && !!child.getComponent(Label)) || null;
    }

    private prepareIntroBubbleTextReveal() {
        const textNode = this.getIntroBubbleTextNode();
        if (!textNode?.isValid || textNode === this.introBubble) return;

        Tween.stopAllByTarget(textNode);
        this.introBubbleTextPosition = textNode.position.clone();
        textNode.active = false;
        textNode.setPosition(v3(this.introBubbleTextPosition.x, this.introBubbleTextPosition.y - 24, this.introBubbleTextPosition.z));

        let labelOpacity = textNode.getComponent(UIOpacity);
        if (!labelOpacity) labelOpacity = textNode.addComponent(UIOpacity);
        labelOpacity.opacity = 0;
    }

    private revealIntroBubbleText() {
        const textNode = this.getIntroBubbleTextNode();
        if (!textNode?.isValid || textNode === this.introBubble) return;

        const finalPos = this.introBubbleTextPosition || textNode.position.clone();
        textNode.active = true;
        Tween.stopAllByTarget(textNode);

        let labelOpacity = textNode.getComponent(UIOpacity);
        if (!labelOpacity) labelOpacity = textNode.addComponent(UIOpacity);

        tween(textNode)
            .to(0.45, { position: finalPos }, { easing: 'cubicOut' })
            .start();

        tween(labelOpacity)
            .to(0.35, { opacity: 255 }, { easing: 'linear' })
            .start();
    }

    private showIntroBubbleReveal() {
        if (!this.introBubble?.isValid) return;

        this.introBubble.active = true;
        let bubbleOpacity = this.introBubble.getComponent(UIOpacity);
        if (!bubbleOpacity) bubbleOpacity = this.introBubble.addComponent(UIOpacity);
        bubbleOpacity.opacity = 0;

        const finalPos = this.introBubble.position.clone();
        this.introBubble.setPosition(v3(finalPos.x, finalPos.y - 30, finalPos.z));

        tween(this.introBubble)
            .to(1, { position: finalPos }, { easing: 'backOut' })
            .call(() => {
                const baseScale = this.introBubble.scale.clone();
                Tween.stopAllByTarget(this.introBubble);
                tween(this.introBubble)
                    .repeatForever(
                        tween()
                            .to(0.7, { scale: v3(baseScale.x * 1.06, baseScale.y * 1.06, baseScale.z) }, { easing: 'sineInOut' })
                            .to(0.7, { scale: baseScale }, { easing: 'sineInOut' })
                    )
                    .start();
            })
            .start();

        tween(bubbleOpacity)
            .to(0.45, { opacity: 255 }, { easing: 'linear' })
            .call(() => this.revealIntroBubbleText())
            .start();
    }

    private setupIntroEmotionState() {
        if (this.introNormalCharacter) {
            this.introNormalCharacter.active = true;
            let normalOpacity = this.introNormalCharacter.getComponent(UIOpacity);
            if (!normalOpacity) normalOpacity = this.introNormalCharacter.addComponent(UIOpacity);
            normalOpacity.opacity = 255;
        }
        if (this.introCryCharacter) {
            this.introCryCharacter.active = false;
            let cryOpacity = this.introCryCharacter.getComponent(UIOpacity);
            if (!cryOpacity) cryOpacity = this.introCryCharacter.addComponent(UIOpacity);
            cryOpacity.opacity = 0;
        }
        if (this.introBubble) {
            this.introBubble.active = false;
            let bubbleOpacity = this.introBubble.getComponent(UIOpacity);
            if (!bubbleOpacity) bubbleOpacity = this.introBubble.addComponent(UIOpacity);
            bubbleOpacity.opacity = 0;
            this.prepareIntroBubbleTextReveal();
        }
        // if (this.introBubbleLabel) {
        //     this.introBubbleLabel.string = "";
        //     this.introBubbleLabel.node.active = false;
        //     let labelOpacity = this.introBubbleLabel.node.getComponent(UIOpacity);
        //     if (!labelOpacity) labelOpacity = this.introBubbleLabel.node.addComponent(UIOpacity);
        //     labelOpacity.opacity = 0;
        // }
    }

    private switchToCryIntro() {
        // Ensure normal fades out first; then show cry, then bubble after a short delay
        const startCryAndBubble = () => {
            if (this.introCryCharacter) {
                this.introCryCharacter.active = true;
                let cryOpacity = this.introCryCharacter.getComponent(UIOpacity);
                if (!cryOpacity) cryOpacity = this.introCryCharacter.addComponent(UIOpacity);
                cryOpacity.opacity = 0;

                // Fade in cry
                tween(cryOpacity)
                    .to(0.45, { opacity: 255 }, { easing: 'linear' })
                    .start();
            }

            // Show bubble a little after the intro state starts.
            this.scheduleOnce(() => this.showIntroBubbleReveal(), 0.18);
        };

        if (this.introNormalCharacter) {
            let normalOpacity = this.introNormalCharacter.getComponent(UIOpacity);
            if (!normalOpacity) normalOpacity = this.introNormalCharacter.addComponent(UIOpacity);
            tween(normalOpacity)
                .to(0, { opacity: 0 }, { easing: 'sineInOut' })
                .call(() => {
                    if (this.introNormalCharacter) this.introNormalCharacter.active = false;
                    // Start cry and bubble after normal has fully faded
                    startCryAndBubble();
                })
                .start();
        } else {
            // No normal character present — start cry immediately
            startCryAndBubble();
        }

        // if (this.introBubbleLabel) {
        //     this.introBubbleLabel.string = bubbleText;
        //     this.introBubbleLabel.node.active = true;

        //     let labelOpacity = this.introBubbleLabel.node.getComponent(UIOpacity);
        //     if (!labelOpacity) labelOpacity = this.introBubbleLabel.node.addComponent(UIOpacity);
        //     labelOpacity.opacity = 0;

        //     tween(labelOpacity)
        //         .delay(0.15)
        //         .to(0.3, { opacity: 255 }, { easing: 'linear' })
        //         .start();
        // }
    }

    private animateIntroCharacters() {
        if (!this.introCharacters || this.introCharacters.length === 0) return;

        const slideOffset = 120;
        const charNodes = this.introCharacters.filter(node => node && node.isValid);
        if (charNodes.length === 0) return;

        charNodes.forEach(charNode => {
            const finalPos = charNode.position.clone();
            charNode.active = true;
            charNode.setPosition(finalPos.x, finalPos.y - slideOffset, finalPos.z);

            let opacity = charNode.getComponent(UIOpacity);
            if (!opacity) {
                opacity = charNode.addComponent(UIOpacity);
            }
            opacity.opacity = 0;
        });

        const duration = 0.0;
        const delayStep = 0;

        charNodes.forEach((charNode, index) => {
            const finalPos = charNode.position.clone();
            finalPos.y += slideOffset;

            this.scheduleOnce(() => {
                Tween.stopAllByTarget(charNode);
                const opacity = charNode.getComponent(UIOpacity);
                tween(charNode)
                    .to(duration, { position: finalPos }, { easing: 'backOut' })
                    .start();

                if (opacity) {
                    tween(opacity)
                        .to(duration * 0.9, { opacity: 255 }, { easing: 'linear' })
                        .start();
                }
            }, index * delayStep);
        });
    }

    private hideIntroAndStartGame() {
        if (!this.introContainer) {
            GridController.isIntroPlaying = false;
            this.startGameplay();
            return;
        }

        Tween.stopAllByTarget(this.introContainer);
        const introOpacity = this.introContainer.getComponent(UIOpacity);

        if (introOpacity) {
            tween(introOpacity)
                .to(0.45, { opacity: 0 }, { easing: 'linear' })
                .start();
        }

        this.scheduleOnce(() => {
            this.introContainer.active = false;
            if (introOpacity) {
                introOpacity.opacity = 0;
            }
            GridController.isIntroPlaying = false;
            this.startGameplay();
        }, 0);
    }

    private performStartupSequence() {
        if (GridController.hasIntroPlayed || GridController.isIntroPlaying) {
            return;
        }

        const introOwner = GridController.allBoxes.find(box => box.introContainer && box.introContainer.isValid);
        if (introOwner && introOwner.introContainer) {
            introOwner.showIntroSequence();
            return;
        }

        this.startGameplay();
    }

    private startGameplay() {
        if (GridController.isIntroPlaying || GridController.hasGameStarted) return;
        GridController.hasGameStarted = true;
        this.runEntrySequence();
    }

    private showInitialTutorial() {
        if (GridController.isGameOver || GridController.isTimerStarted) return;
        const defaultGuideOwner = GridController.allBoxes.find(box => box.guideNode) || this;
        // The configured target can be on any GridController, not only the first grid cell.
        const tutorialConfigOwner = GridController.allBoxes.find(box => box.tutorialStartCell.trim().length > 0) || null;
        const tutorialSetting = tutorialConfigOwner?.tutorialStartCell.trim() || "";

        // An explicit Inspector target takes priority over the node that owns the hand graphic.
        if (tutorialSetting.length > 0) {
            const raw = tutorialSetting;

            // Case A: Comma-separated sequence (e.g. "5,1,9")
            if (raw.includes(",") && !raw.includes("/")) {
                const tokens = raw.split(",").map(s => s.trim()).filter(s => s.length > 0);
                if (tokens.length > 0) {
                    GridController.tutorialSequence = tokens;
                    GridController.tutorialSeqIndex = 0;
                    GridController.tutorialCurrentRepeat = 0;
                    this.startTutorialSequenceFromList();
                    return;
                }
            }

            // Case B: Parent/child or single token (backward-compatible)
            const sep = raw.includes("/") ? "/" : raw.includes(",") ? "," : null;
            let targetBox: GridController | undefined;
            if (sep) {
                const parts = raw.split(sep).map(s => s.trim());
                const parentName = parts[0];
                const childName = parts[1];
                targetBox = GridController.allBoxes.find(b => b.node.name === childName && b.node.parent && b.node.parent.name === parentName);
            } else {
                // single token — match node name directly
                targetBox = GridController.allBoxes.find(b => b.node.name === raw);
            }

            if (targetBox && !targetBox.isSolved) {
                GridController.tutorialColumnKey = targetBox.getColumnKey();
                GridController.tutorialStep = 1;
                GridController.tutorialCurrentBox = targetBox;
                const guideOwner = targetBox.guideNode ? targetBox : defaultGuideOwner;
                guideOwner.showGuideLabel();
                targetBox.showIdleHint(true);
                return;
            }
        }

        // If no explicit target exists, use the cell where the hand graphic was assigned.
        const attachedHandBox = GridController.allBoxes.find(box => box.handNode?.isValid && !box.isSolved);
        if (attachedHandBox) {
            GridController.tutorialColumnKey = attachedHandBox.getColumnKey();
            GridController.tutorialStep = 1;
            GridController.tutorialCurrentBox = attachedHandBox;
            this.showOpeningTutorialOverlay();
            const guideOwner = attachedHandBox.guideNode ? attachedHandBox : defaultGuideOwner;
            guideOwner.showGuideLabel();
            attachedHandBox.showIdleHint(true);
            return;
        }

        // Fallback: show hand on any available hint target
        const handTarget = GridController.allBoxes.find(box => !box.isSolved && box.associatedHint && box.associatedHint.active) || this;
        defaultGuideOwner.showGuideLabel();
        if (handTarget.associatedHint && handTarget.associatedHint.active) handTarget.showIdleHint(true);
    }

    // Play a tutorial sequence defined by `tutorialSequence`.
    // Each named node will have the hand shown `tutorialRepeatTimes` times, then the sequence advances.
    private startTutorialSequenceFromList() {
        if (!GridController.tutorialSequence || GridController.tutorialSequence.length === 0) return;

        // Determine a default parent (e.g., Grid-001) to prefer when resolving short numeric names
        const defaultParentName = GridController.allBoxes.find(b => b.node.parent && b.node.parent.isValid)?.node.parent.name || null;

        const playStep = (index: number) => {
            if (index >= GridController.tutorialSequence.length) {
                // Completed sequence
                GridController.tutorialSequence = [];
                GridController.tutorialSeqIndex = 0;
                GridController.tutorialCurrentRepeat = 0;
                GridController.isHandShowing = false;
                if (GridController.globalHandNode) {
                    Tween.stopAllByTarget(GridController.globalHandNode);
                    GridController.globalHandNode.setScale(v3(0, 0, 0));
                    GridController.globalHandNode.active = false;
                }
                return;
            }

            const rawToken = GridController.tutorialSequence[index];
            // Support formats: "GridName", "GridName:2" (child index, 1-based), "GridName/CellName"
            let gridName = rawToken;
            let childSpecifier: string | null = null;
            if (rawToken.includes(":") || rawToken.includes("/") || rawToken.includes('.')) {
                const sep = rawToken.includes(":") ? ":" : rawToken.includes("/") ? "/" : ".";
                const parts = rawToken.split(sep).map(s => s.trim());
                gridName = parts[0];
                childSpecifier = parts[1] || null;
            }

            // Prefer a box under the same parent (common Grid container) when available
            let targetBox = null as (GridController | null);
            if (defaultParentName) {
                targetBox = GridController.allBoxes.find(b => b.node.name === gridName && b.node.parent && b.node.parent.name === defaultParentName && !b.isSolved) || null;
            }
            if (!targetBox) {
                targetBox = GridController.allBoxes.find(b => b.node.name === gridName && !b.isSolved) || null;
            }

            console.log(`[TUTORIAL] token='${rawToken}' -> resolved grid='${targetBox ? targetBox.node.name : 'NONE'}' (parent='${targetBox && targetBox.node.parent ? targetBox.node.parent.name : 'N/A'}')`);
            if (!targetBox) {
                // Skip missing/solved and continue
                playStep(index + 1);
                return;
            }

            GridController.tutorialSeqIndex = index;
            GridController.tutorialCurrentRepeat = 0;

            const showAndMaybeRepeat = () => {
                if (!targetBox || targetBox.isSolved) {
                    playStep(index + 1);
                    return;
                }
                // Ensure any global flags allow showing
                GridController.isHandShowing = false;
                const guideOwner = targetBox.guideNode
                    ? targetBox
                    : GridController.allBoxes.find(box => box.guideNode) || this;
                guideOwner.showGuideLabel();
                if (childSpecifier && targetBox) {
                    // If numeric -> treat as 1-based index
                    const maybeIndex = parseInt(childSpecifier);
                    if (!isNaN(maybeIndex)) {
                        targetBox.showIdleHintOnChildIndex(maybeIndex - 1);
                    } else {
                        targetBox.showIdleHintOnChildName(childSpecifier);
                    }
                } else {
                    targetBox.showIdleHint();
                }

                // Hide after a short duration and either repeat or advance
                this.scheduleOnce(() => {
                    targetBox.hideTutorialElements("SequenceHide");
                    GridController.isHandShowing = false;
                    if (GridController.globalHandNode) {
                        Tween.stopAllByTarget(GridController.globalHandNode);
                        GridController.globalHandNode.setScale(v3(0, 0, 0));
                        GridController.globalHandNode.active = false;
                    }

                    GridController.tutorialCurrentRepeat++;
                    if (GridController.tutorialCurrentRepeat < GridController.tutorialRepeatTimes) {
                        // Short gap then show again
                        this.scheduleOnce(() => showAndMaybeRepeat(), 0.45);
                    } else {
                        // Advance to next in sequence
                        this.scheduleOnce(() => playStep(index + 1), 0.45);
                    }
                }, 1.6);
            };

            // Start the first show for this step
            showAndMaybeRepeat();
        };

        playStep(0);
    }

    private showGuideLabel() {
        if (!this.guideNode) return;

        Tween.stopAllByTarget(this.guideNode);
        this.guideNode.active = true;
        this.guideNode.setScale(v3(0, 0, 0));
        tween(this.guideNode).to(0.5, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
            .call(() => {
                tween(this.guideNode).to(0.8, { scale: v3(1.1, 1.1, 1) }, { easing: 'sineInOut' })
                    .to(0.8, { scale: v3(1, 1, 1) }, { easing: 'sineInOut' })
                    .union().repeatForever().start();
            }).start();
    }

//   private showEntryBlink(targetNode: Node) {
//     const sprite = targetNode.getComponent(Sprite);
//     if (!sprite) return;

//     // 1. Create a temporary flash overlay for the blink
//     // This allows us to have rounded corners even if the box is square
//     let flash = targetNode.getChildByName("BlinkFlash");
//     if (!flash) {
//         flash = new Node("BlinkFlash");
//         targetNode.addChild(flash);
//         const ut = flash.addComponent(UITransform);
//         ut.setContentSize(targetNode.getComponent(UITransform)!.contentSize);
//         flash.addComponent(Graphics);
//         flash.addComponent(UIOpacity);
//     }
    
//     const g = flash.getComponent(Graphics)!;
//     const ut = flash.getComponent(UITransform)!;
//     const opacity = flash.getComponent(UIOpacity)!;
    
//     // --- DRAW CURVED BLINK BACKGROUND ---
//     const flashColor = new Color().fromHEX('#FFF59D'); // Light Beige/Yellow
//     g.clear();
//     g.fillColor = flashColor;
//     // (x, y, width, height, cornerRadius)
//     g.roundRect(-ut.width/2, -ut.height/2, ut.width, ut.height, 20); 
//     g.fill();

//     flash.active = true;
//     opacity.opacity = 0;
    
//     // Set the base cell to the "OFF" state (Gray) immediately
//     sprite.color = Color.WHITE;

//     // --- SEQUENTIAL ANIMATION ---
//     Tween.stopAllByTarget(targetNode);
//     Tween.stopAllByTarget(opacity);

//     tween(targetNode)
//         .to(0.15, { scale: v3(this.originalGridScale.x * 1, this.originalGridScale.y * 1, 1) }, { easing: 'sineOut' })
//         .to(0.15, { scale: this.originalGridScale }, { easing: 'sineIn' })
//         .start();

//     tween(opacity)
//         .to(0.1, { opacity: 255 }) // Fade In
//         .delay(0.01)
//         .to(0.01, { opacity: 0 })   // Fade Out
//         .call(() => {
//             flash.active = false; 
//             // Stay Gray!
//             sprite.color = Color.WHITE; 
//         })
//         .start();
// }
// Ensure this is PUBLIC so the other boxes can call it during a loop
    public hideSelectedFrame() {
        if (this.selectedFrameNode && this.selectedFrameNode.isValid) {
            this.selectedFrameNode.active = false;
        }
    }

    // Helper for your new corner logic
    private drawCornerDash(graphics: Graphics, x: number, y: number, angle: number) {
        // Keeps the rounded corner looking smooth
        graphics.circle(x, y, 2.0); 
    }

    // The updated frame logic (make sure it's public if called from external sequences)
public showSelectedFrame() {
    GridController.allBoxes.forEach(box => box.hideSelectedFrame());

    const uiTrans = this.node.getComponent(UITransform);
    if (!uiTrans) return;

    if (!this.selectedFrameNode || !this.selectedFrameNode.isValid) {
        this.selectedFrameNode = new Node("SelectedDottedButton");
        this.node.addChild(this.selectedFrameNode);
        this.selectedFrameNode.addComponent(Graphics);
    }

    const graphics = this.selectedFrameNode.getComponent(Graphics)!;
    
    // --- EXACT PARAMETERS FOR THE REFERENCE LOOK ---
    const width = uiTrans.contentSize.width - 6; 
    const height = uiTrans.contentSize.height - 6;
    const halfW = width / 2;
    const halfH = height / 2;
    
    const borderRadius = 25;       // Rounded corner radius
    const dashLength = 9;         // Dash length
    const gap = 7;                 // Dash gap
    const thickness = 4.2;         // Stitch thickness
    const inset = 4.5;             // Margin from edge
    // -----------------------------------------------

    this.selectedFrameNode.active = true;
    this.selectedFrameNode.setPosition(0, 0, 0);
    this.selectedFrameNode.setScale(1.05, 1.05, 1.05);
    this.selectedFrameNode.setSiblingIndex(this.node.children.length - 1);

    graphics.clear();

    // 1. DRAW BEIGE BACKGROUND (The Fill)
    graphics.fillColor = new Color().fromHEX('#FFF59D');
    // ().fromHEX('#FFF59D')
    graphics.roundRect(-halfW, -halfH, width, height, borderRadius);
    graphics.fill();

    // 2. SETUP BROWN STITCHES (The Dashes)
    graphics.strokeColor = new Color(179, 126, 64, 255);
    
    graphics.lineWidth = thickness;
    graphics.lineCap = Graphics.LineCap.ROUND;
    graphics.lineJoin = Graphics.LineJoin.ROUND;

    const r = borderRadius - inset;
    const innerW = halfW - borderRadius;
    const innerH = halfH - borderRadius;

    // TOP EDGE
    this.manualStitchLine(graphics, -innerW, halfH - inset, innerW, halfH - inset, dashLength, gap);
    // BOTTOM EDGE
    this.manualStitchLine(graphics, -innerW, -halfH + inset, innerW, -halfH + inset, dashLength, gap);
    // LEFT EDGE
    this.manualStitchLine(graphics, -halfW + inset, -innerH, -halfW + inset, innerH, dashLength, gap);
    // RIGHT EDGE
    this.manualStitchLine(graphics, halfW - inset, -innerH, halfW - inset, innerH, dashLength, gap);

    // --- CORNERS (Calculated manually to prevent the circle glitch) ---
    // Top Right
    this.manualStitchArc(graphics, innerW, innerH, r, 0, 90, dashLength, gap);
    // Top Left
    this.manualStitchArc(graphics, -innerW, innerH, r, 90, 180, dashLength, gap);
    // Bottom Left
    this.manualStitchArc(graphics, -innerW, -innerH, r, 180, 270, dashLength, gap);
    // Bottom Right
    this.manualStitchArc(graphics, innerW, -innerH, r, 270, 360, dashLength, gap);
}

private spawnClickRipple(worldPos: Vec3) {
    const rippleNode = new Node("ClickRipple");
    const canvas = director.getScene()?.getChildByPath("Canvas");
    if (!canvas) return;

    canvas.addChild(rippleNode);
    rippleNode.setWorldPosition(worldPos);

    // Spread the 5 rays evenly around the center (Vertical Up)
    const startAngle = -80; // Tilted left
    const angleStep = 30;   // 30 degrees distance between each ray

    for (let i = 0; i < 5; i++) {
        const ray = new Node("Ray");
        rippleNode.addChild(ray);
        
        const g = ray.addComponent(Graphics);
        const color = new Color().fromHEX('#FFD600'); // Bright Yellow
        g.fillColor = color;
        
        // Draw the "Sausage" dash
        // Increased thickness and length slightly to match image 2
        g.roundRect(-2.5, 0, 5, 16, 2.5);
        g.fill();

        // 1. Calculate the Angle: Result will be -60, -30, 0, 30, 60
        const angle = startAngle + (i * angleStep);
        const rad = angle * Math.PI / 180;

        // 2. Rotate the Dash Node to face outward
        // We use negative angle because Cocos rotations are counter-clockwise
        ray.angle = -angle;
        
        // 3. Initial state
        const op = ray.addComponent(UIOpacity);
        op.opacity = 0;
        ray.setScale(v3(0, 0, 1));

        // 4. Animation: Burst outwards directly in the direction of the angle
        const burstDistance = 25; // Distance from center

        tween(ray)
            .parallel(
                tween().to(0.3, { scale: v3(1, 1, 1) }, { easing: 'backOut' }),
                tween().to(0.4, { 
                    position: v3(
                        Math.sin(rad) * burstDistance, 
                        Math.cos(rad) * burstDistance, 
                        0
                    ) 
                }, { easing: 'quartOut' }),
                tween(op).to(0.1, { opacity: 255 }).delay(0.2).to(0.2, { opacity: 0 })
            )
            .call(() => {
                if (i === 4) rippleNode.destroy();
            })
            .start();
    }
}

private manualStitchLine(g: Graphics, x1: number, y1: number, x2: number, y2: number, len: number, gap: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const totalDist = Math.sqrt(dx * dx + dy * dy);
    let progress = 0;

    while (progress < totalDist) {
        const startT = progress / totalDist;
        const endT = Math.min(progress + len, totalDist) / totalDist;
        g.moveTo(x1 + dx * startT, y1 + dy * startT);
        g.lineTo(x1 + dx * endT, y1 + dy * endT);
        g.stroke();
        progress += (len + gap);
    }
}

private manualStitchArc(g: Graphics, cx: number, cy: number, r: number, startDeg: number, endDeg: number, len: number, gap: number) {
    const totalRad = (Math.PI / 180) * (endDeg - startDeg);
    const circumference = Math.abs(totalRad) * r;
    const angleForStep = (len + gap) / r;
    const angleForDash = len / r;

    let currentAngle = (Math.PI / 180) * startDeg;
    const finalAngle = (Math.PI / 180) * endDeg;

    while (currentAngle < finalAngle) {
        let segmentEnd = currentAngle + angleForDash;
        if (segmentEnd > finalAngle) segmentEnd = finalAngle;

        // Approximating the curve with 3 tiny straight lines per dash
        // This is perfectly curved to the eye but safe from engine glitches
        const steps = 3;
        g.moveTo(cx + Math.cos(currentAngle) * r, cy + Math.sin(currentAngle) * r);
        
        for (let i = 1; i <= steps; i++) {
            const subAngle = currentAngle + (segmentEnd - currentAngle) * (i / steps);
            g.lineTo(cx + Math.cos(subAngle) * r, cy + Math.sin(subAngle) * r);
        }
        g.stroke();
        currentAngle += angleForStep;
    }
}

// private drawActualDashedLine(g: Graphics, x1: number, y1: number, x2: number, y2: number, dashLen: number, gap: number) {
//     const dx = x2 - x1;
//     const dy = y2 - y1;
//     const distance = Math.sqrt(dx * dx + dy * dy);
//     let current = 0;

//     while (current < distance) {
//         const startT = current / distance;
//         const endT = Math.min(current + dashLen, distance) / distance;
        
//         g.moveTo(x1 + startT * dx, y1 + startT * dy);
//         g.lineTo(x1 + endT * dx, y1 + endT * dy);
//         g.stroke(); // Draw this segment
        
//         current += (dashLen + gap);
//     }
// }

// private drawActualDashedArc(g: Graphics, cx: number, cy: number, r: number, startDeg: number, endDeg: number, dashLen: number, gap: number) {
//     const startRad = startDeg * (Math.PI / 180);
//     const endRad = endDeg * (Math.PI / 180);
    
//     // The "Angle step" is determined by dash length relative to the circle size (Arc Length / Radius)
//     const angleForDash = dashLen / r; 
//     const angleForGap = gap / r;
//     const totalStep = angleForDash + angleForGap;

//     let currentAngle = startRad;

//     // Correct for bottom-right corner going past 360 to ensure the loop finishes
//     while (currentAngle < endRad) {
//         let segmentEnd = currentAngle + angleForDash;
        
//         // Ensure we don't draw past the end of the corner
//         if (segmentEnd > endRad) segmentEnd = endRad;

//         // moveTo is critical: move the pen to the start of the curved segment
//         g.moveTo(cx + Math.cos(currentAngle) * r, cy + Math.sin(currentAngle) * r);
//         // arc actually draws a BENT line along the path
//         g.arc(cx, cy, r, currentAngle, segmentEnd, false);
//         g.stroke();
        
//         currentAngle += totalStep;
//     }
// }
    private applyPulse(targetNode: Node, isOn: boolean) {
        Tween.stopAllByTarget(targetNode);
        const isHint = targetNode === this.associatedHint || targetNode.parent?.name === "Hints";
        const baseScale = isHint ? this.originalHintScale : this.originalGridScale;
        const sprite = targetNode.getComponent(Sprite);
        if (isOn) {
            const targetScale = v3(baseScale.x * 1.02, baseScale.y * 1.02, 1);
            const highlightColor = new Color().fromHEX('#FFF59D');
            tween(targetNode).parallel(
                tween().to(1.0, { scale: targetScale }, { easing: 'sineInOut' }).to(1.0, { scale: baseScale }, { easing: 'sineInOut' }),
                sprite ? tween(sprite).to(1.0, { color: highlightColor }, { easing: 'sineInOut' }).to(1.0, { color: Color.WHITE }, { easing: 'sineInOut' }) : tween()
            ).union().repeatForever().start();
        } else {
            targetNode.setScale(baseScale);
            if (sprite) sprite.color = Color.WHITE;
        }
    }

    onGridCellClicked(event: Event) {
        if (GridController.isIntroPlaying || GridController.isGameOver || this.isSolved) return;
        // --- NEW: Track User Taps ---
        this.checkTapProgress();

        if (!GridController.isChallengeStarted) {
            GridController.isChallengeStarted = true;
            Analytics.instance?.dispatchEvent(analyticsEvents.CHALLENGE_STARTED);
        }
        if (GridController.isGameOver) return;
        if (!GridController.isTimerStarted) {
            GridController.isTimerStarted = true;
            if (this.bgmClip && GridController.bgmSource) {
                GridController.bgmSource.clip = this.bgmClip;
                GridController.bgmSource.loop = true;
                GridController.bgmSource.volume = 0.5;
                GridController.bgmSource.play();
            }
        }
        if (this.clickBoxClip && GridController.fxSource) {
            GridController.fxSource.playOneShot(this.clickBoxClip, 1);
        }
        if (this.guideNode) {
            Tween.stopAllByTarget(this.guideNode);
            this.guideNode.active = false;
        }
        if (!GridController.isTimerStarted) GridController.isTimerStarted = true;
        this.hideTutorialElements("Box Clicked");
        // Do not play hint voice on every grid tap. Hint voice is handled after clue reveal/reposition.
        // this.syncHintHighlight();
        if (GridController.activeBox && GridController.activeBox !== this) {
            GridController.activeBox.closeSelectionMenu();
        }
        this.refreshSelectionMenuItems();
        if (this.selectionMenu.active) return;
        // this.showSelectedFrame();
        this.selectionMenu.active = true;
        GridController.activeBox = this;
        
          // --- FIX 1: TOP LAYER FORCE ---
    // Get the Canvas so we can move the menu there if it isn't already
    const canvas = director.getScene()?.getChildByPath("Canvas");
    if (canvas) {
        this.selectionMenu.parent = canvas; // Moves it out of any box to the Root
        this.selectionMenu.setSiblingIndex(canvas.children.length - 1); // Absolute bottom of list = TOP of view
    }

    GridController.activeBox = this; 
    
    // --- FIX 2: COORDINATE CALCULATIONS ---
    // Since it's on the Canvas now, we set the World Position
    // We target slightly below the box clicked
        this.positionSelectionMenuNearGridCell();
        this.selectionMenu.setScale(v3(0, 0, 0));
        tween(this.selectionMenu).to(0.2, { scale: this.originalSelectionMenuScale }, { easing: 'backOut' }).call(() => {
            if (!GridController.hasShownFirstTapHand) {
                this.showHandOnCorrectMenuItem();
                GridController.hasShownFirstTapHand = true;
            }
            //   this.startMenuTimer();
        }).start();
    }

    private positionSelectionMenuNearGridCell() {
        if (!this.selectionMenu) return;

        const menuTrans = this.selectionMenu.getComponent(UITransform);
        const canvas = director.getScene()?.getChildByPath("Canvas");
        const canvasTrans = canvas?.getComponent(UITransform);
        const width = menuTrans ? menuTrans.contentSize.width * Math.abs(this.originalSelectionMenuScale.x) : this.originalSelectionMenuSize.width;
        const height = menuTrans ? menuTrans.contentSize.height * Math.abs(this.originalSelectionMenuScale.y) : this.originalSelectionMenuSize.height;
        const anchorX = menuTrans ? menuTrans.anchorPoint.x : 0.5;
        const anchorY = menuTrans ? menuTrans.anchorPoint.y : 0.5;
        const margin = 18;
        let targetX = this.node.worldPosition.x;
        let targetY = this.node.worldPosition.y - 70;

        if (canvasTrans) {
            const canvasWorld = canvas!.worldPosition;
            const minX = canvasWorld.x - canvasTrans.contentSize.width / 2 + width * anchorX + margin;
            const maxX = canvasWorld.x + canvasTrans.contentSize.width / 2 - width * (1 - anchorX) - margin;
            const minY = canvasWorld.y - canvasTrans.contentSize.height / 2 + height * anchorY + margin;
            const maxY = canvasWorld.y + canvasTrans.contentSize.height / 2 - height * (1 - anchorY) - margin;

            targetX = Math.min(maxX, Math.max(minX, targetX));
            targetY = Math.min(maxY, Math.max(minY, targetY));
        }

        this.selectionMenu.setWorldPosition(v3(targetX, targetY, 0));
    }
    private syncHintHighlight() {
    // 1. Safety: Do we have a hint and a voice clip?
    if (!this.associatedHint || !this.hintVoiceClip) return;

    // 2. Reset all bars across all grid cells
    GridController.allBoxes.forEach(box => {
        if (box.highlightBar) {
            Tween.stopAllByTarget(box.highlightBar);
            box.highlightBar.progress = 0;
        }
    });

    // 3. Play the Audio Clip
    if (GridController.fxSource) {
        GridController.fxSource.stop();
        GridController.fxSource.clip = this.hintVoiceClip;
        GridController.fxSource.play();

        // --- THE FIX ---
        // We cast this.hintVoiceClip to 'any' to bypass the TypeScript error.
        // Also adding a fallback ( || 2.0) in case the duration isn't loaded yet.
        const audioClip = this.hintVoiceClip as any;
        const clipDuration = audioClip.duration || 2.0; 

        if (this.highlightBar) {
            this.highlightBar.progress = 0;
            
            tween(this.highlightBar)
                .to(clipDuration, { progress: 1 })
                .start();
        }
    }
}
// private startMenuTimer() {
//     if (!this.selectionTimerBar) return;

//     // Reset bar to full
//     Tween.stopAllByTarget(this.selectionTimerBar);
//     this.selectionTimerBar.progress = 2;

//     // Animate to empty
//     tween(this.selectionTimerBar)
//         // .to(this.menuTimerDuration, { progress: 0 })
//         .call(() => {
//             console.log("Timer ended, closing menu...");
//             // Optional: You can treat this as an 'Incorrect' move 
//             // by calling this.handleIncorrectMove() if you want!
//             this.closeSelectionMenu();
//         })
//         .start();
// }

    private showHandOnCorrectMenuItem() {
        const hand = GridController.globalHandNode;
        if (!hand || !this.selectionMenu) return;

        const targetItem = this.getSelectionMenuItemByIdentity(this.correctItemName);
        if (targetItem && targetItem.active) {
            GridController.isHandShowing = true;
            hand.active = true;
            hand.setSiblingIndex(999);
            hand.setWorldPosition(v3(targetItem.worldPosition.x + 30, targetItem.worldPosition.y - 60, 0));
            hand.setScale(v3(0, 0, 0));
            tween(hand).to(0.2, { scale: GridController.initialHandScale }, { easing: 'backOut' }).call(() => this.playHandAnimation()).start();
            Tween.stopAllByTarget(targetItem);
            const savedScale = this.menuItemScales.get(targetItem.name) || v3(1, 1, 1);
            tween(targetItem).to(0.5, { scale: v3(savedScale.x * 1, savedScale.y * 1, 1) }, { easing: 'sineInOut' }).to(0.5, { scale: savedScale }, { easing: 'sineInOut' }).union().repeatForever().start();
        }
    }

    private getSelectionMenuItemByIdentity(identity: string): Node | null {
        if (!this.selectionMenu?.isValid || !identity) return null;
        return this.getSelectionMenuItems().find(item => this.getAssignedItemIdentity(item) === identity) || null;
    }

    onMenuItemClicked(event: Event) {
        if (GridController.isIntroPlaying || GridController.isGameOver) return;
        event.propagationStopped = true;
        this.checkTapProgress(); 

        GridController.idleTimer = 0;
        if (this.selectionTimerBar) Tween.stopAllByTarget(this.selectionTimerBar);
        const clickedNode = event.target as Node;
        if (!clickedNode.active || this.isMenuItemCompleted(clickedNode)) return;

        const clickedIdentity = this.getAssignedItemIdentity(clickedNode);
        if (clickedIdentity === this.correctItemName) this.handleSuccessMove(clickedNode);
        else this.handleIncorrectMove();
    }

    private getCanvasRelativeScale(worldScale: Vec3): Vec3 {
        const canvas = director.getScene()?.getChildByPath("Canvas");
        const canvasScale = canvas?.worldScale || v3(1, 1, 1);
        const safeX = Math.abs(canvasScale.x) > 0.0001 ? canvasScale.x : 1;
        const safeY = Math.abs(canvasScale.y) > 0.0001 ? canvasScale.y : 1;
        const safeZ = Math.abs(canvasScale.z) > 0.0001 ? canvasScale.z : 1;

        return v3(worldScale.x / safeX, worldScale.y / safeY, worldScale.z / safeZ);
    }

    private getPlacedItemScale(sourceSize: Size, sourceWorldScale: Vec3): Vec3 {
        const targetTrans = this.node.getComponent(UITransform);
        if (!targetTrans || sourceSize.width <= 0 || sourceSize.height <= 0) {
            return this.getCanvasRelativeScale(sourceWorldScale);
        }

        const targetWorldScale = this.node.worldScale || v3(1, 1, 1);
        const padding = 0.72;
        const maxWidth = targetTrans.contentSize.width * Math.abs(targetWorldScale.x) * padding;
        const maxHeight = targetTrans.contentSize.height * Math.abs(targetWorldScale.y) * padding;
        const fitWorldScale = Math.min(maxWidth / sourceSize.width, maxHeight / sourceSize.height);
        if (!isFinite(fitWorldScale) || fitWorldScale <= 0) {
            return this.getCanvasRelativeScale(sourceWorldScale);
        }

        const sourceUniformScale = Math.min(Math.abs(sourceWorldScale.x), Math.abs(sourceWorldScale.y));
        const placedWorldScale = Math.min(sourceUniformScale, fitWorldScale);

        return this.getCanvasRelativeScale(v3(placedWorldScale, placedWorldScale, sourceWorldScale.z));
    }

   private handleSuccessMove(itemNode: Node) {
    this.hideTutorialElements("Match Success");
    if (this.winMatchClip && GridController.fxSource) {
        GridController.fxSource.playOneShot(this.winMatchClip, 1);
    }

    // --- POP TICKS (RIGHT MARKS) ON ALL RELATED HINTS ---
    // if (this.rightNode) {
    //     this.rightNode.active = true;
    //     this.rightNode.setScale(v3(0, 0, 0));
    //     tween(this.rightNode).to(0.3, { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
    // }
    
    const sourceSprite = itemNode.getComponent(Sprite);
    const sourceLabel = itemNode.getComponent(Label);
    if (!sourceSprite && !sourceLabel) return;

    const itemTrans = itemNode.getComponent(UITransform);
    const sourceSize = itemTrans?.contentSize.clone() || new Size(165, 75);
    const sourceScale = this.getCanvasRelativeScale(itemNode.worldScale || itemNode.scale);
    const placedScale = this.getPlacedItemScale(sourceSize, itemNode.worldScale || itemNode.scale);
    const startPos = itemNode.worldPosition.clone();
    const endPos = this.node.worldPosition.clone();
    
    const flyNode = new Node("FlyingItem");
    director.getScene()?.getChildByName("Canvas")?.addChild(flyNode);
    const flyTrans = flyNode.addComponent(UITransform);
    flyTrans.setContentSize(sourceSize);
    if (sourceSprite?.spriteFrame) {
        const flySprite = flyNode.addComponent(Sprite);
        flySprite.spriteFrame = sourceSprite.spriteFrame;
        flySprite.sizeMode = Sprite.SizeMode.CUSTOM;
    } else if (sourceLabel) {
        const flyLabel = flyNode.addComponent(Label);
        flyLabel.string = sourceLabel.string;
        flyLabel.font = sourceLabel.font;
        flyLabel.fontSize = sourceLabel.fontSize;
        flyLabel.lineHeight = sourceLabel.lineHeight;
        flyLabel.color = sourceLabel.color.clone();
        flyLabel.horizontalAlign = sourceLabel.horizontalAlign;
        flyLabel.verticalAlign = sourceLabel.verticalAlign;
        flyLabel.overflow = sourceLabel.overflow;
        flyLabel.enableWrapText = sourceLabel.enableWrapText;
    }
    
    flyNode.setWorldPosition(startPos);
    flyNode.setScale(sourceScale);
    
    const itemIdentity = this.getAssignedItemIdentity(itemNode);
    GridController.markItemCompleted(itemIdentity, this.getMenuItemCompletionKey(itemNode));
    itemNode.active = false;
    const button = itemNode.getComponent(Button);
    if (button) button.interactable = false;

    // Tutorial: advance hand to next cell in column or hide after second
    if (GridController.tutorialColumnKey) {
        const myCol = this.getColumnKey();
        if (myCol === GridController.tutorialColumnKey) {
            // If we're on the first step and this was the current tutorial box, move hand to next
            if (GridController.tutorialStep === 0 && GridController.tutorialCurrentBox === this) {
                // Level 2: after cell 1, guide the player to the other cell sharing Hint1 (cell 7).
                const candidates = GridController.allBoxes.filter(b =>
                    !b.isSolved &&
                    b !== this &&
                    b.associatedHint === this.associatedHint
                );
                const shouldAdvanceToAnotherCell =
                    director.getScene()?.name === "Landmark-001" &&
                    this.node.name === "1" &&
                    !!this.associatedHint;
                if (shouldAdvanceToAnotherCell && candidates.length > 0) {
                    // Advance from bottom-most to top-most within the column
                    candidates.sort((a, b) => a.node.worldPosition.y - b.node.worldPosition.y);
                    const nextBox = candidates[0];
                   // GridController.tutorialStep = 2;
                    GridController.tutorialCurrentBox = nextBox;
                    // show hand on next after a short delay so animations don't clash
                    this.scheduleOnce(() => {
                        GridController.isHandShowing = false;
                        nextBox.showIdleHint();
                    }, 0.35);
                } else {
                    // nothing to advance to — end tutorial
                    GridController.tutorialColumnKey = null;
                    GridController.tutorialStep = 0;
                    GridController.tutorialCurrentBox = null;
                    GridController.isHandShowing = false;
                    if (GridController.globalHandNode) GridController.globalHandNode.active = false;
                }
            } else if (GridController.tutorialStep === 0 && GridController.tutorialCurrentBox === this) {
                // Completed second target — hide hand and clear tutorial
                GridController.tutorialColumnKey = null;
                GridController.tutorialStep = 0;
                GridController.tutorialCurrentBox = null;
                GridController.isHandShowing = false;
                if (GridController.globalHandNode) {
                    Tween.stopAllByTarget(GridController.globalHandNode);
                    GridController.globalHandNode.setScale(v3(0, 0, 0));
                    GridController.globalHandNode.active = false;
                }
            }
        }
    }

    this.closeSelectionMenu();
    this.executeFlyingMovement(flyNode, endPos, sourceSize, placedScale, startPos);
}
    private executeFlyingMovement(flyNode: Node, endPos: Vec3, finalSize: Size, finalScale: Vec3, itemStartPos: Vec3) {
        tween(flyNode).parallel(
            tween().to(0.55, { worldPosition: endPos }, { easing: 'cubicOut' }),
            tween().to(0.55, { scale: finalScale }, { easing: 'elasticOut' })
        ).call(() => {
            this.hideSelectedFrame();
            this.isSolved = true;
            this.showSolvedCellHighlight();
            // The placement decoration is already visible from game start.
            // Keep the final column decoration hidden until the column completes.
            if (this.placementDecorationNode?.isValid) this.placementDecorationNode.active = true;
            if (this.decorationPlacementNode?.isValid) this.decorationPlacementNode.active = false;
            this.revealDecorationForPlacedItem();
            flyNode.name = "PlacedItem";
            const columnKey = this.getColumnKey();
            const solvedCount = GridController.incrementColumnCompletion(columnKey);
            const columnSize = this.getColumnSize(columnKey);
            const requiredCompletion = Math.max(2, Math.min(3, columnSize));

            if (solvedCount >= requiredCompletion && !GridController.completedColumnDecorations.has(columnKey)) {
                GridController.completedColumnDecorations.add(columnKey);
                this.showColumnCompletionDecoration(columnKey);
            }
            this.playBurst();
            // Start rotation effect at the grid box location and keep it running
            this.playSuccessRotation(endPos);
            GridController.matchesMade++;
            this.trackProgression();
            this.handleHintFeedback(() => {
                this.scheduleOnce(() => {
                    if (this.hiddenCluesToUnlock.length > 0) this.revealNewClues();
                    if (GridController.matchesMade >= this.totalMatchesNeeded) {
                        GridController.isTimerStarted = false;
                        this.scheduleOnce(() => this.handleGameOver("WIN"), 0);
                    }
                }, );
            });
        }).start();
    }

    private trackProgression() {
        const progress = (GridController.matchesMade / this.totalMatchesNeeded);
        if (progress >= 0.75 && !GridController.hasPassed75) {
            GridController.hasPassed75 = true;
            Analytics.instance?.dispatchEvent(analyticsEvents.CHALLENGE_PASS_75);
        } else if (progress >= 0.50 && !GridController.hasPassed50) {
            GridController.hasPassed50 = true;
            Analytics.instance?.dispatchEvent(analyticsEvents.CHALLENGE_PASS_50);
        } else if (progress >= 0.25 && !GridController.hasPassed25) {
            GridController.hasPassed25 = true;
            Analytics.instance?.dispatchEvent(analyticsEvents.CHALLENGE_PASS_25);
        }
    }

    private resolveHintContainer(): Node | null {
        if (this.hintContainer?.isValid) {
            if (this.hintContainer.name === "Hints") return this.hintContainer;

            const parent = this.hintContainer.parent;
            if (parent?.isValid && parent.name === "Hints") return parent;
        }

        if (this.associatedHint?.isValid) {
            const parent = this.associatedHint.parent;
            if (parent?.isValid && parent.name === "Hints") return parent;
        }

        return this.hintContainer?.isValid ? this.hintContainer : null;
    }

    private cacheHintOriginalScales() {
        const hintContainer = this.resolveHintContainer();
        if (!hintContainer?.isValid) return;

        hintContainer.children.forEach(hint => {
            if (!GridController.hintOriginalScales.has(hint)) {
                GridController.hintOriginalScales.set(hint, hint.scale.clone());
            }
        });
    }

    private getHintOriginalScale(hint: Node): Vec3 {
        let scale = GridController.hintOriginalScales.get(hint);
        if (!scale) {
            scale = hint.scale.clone();
            GridController.hintOriginalScales.set(hint, scale);
        }
        return scale.clone();
    }

    private getHintRevealScale(targetNode?: Node): Vec3 {
        if (targetNode?.isValid) {
            const targetScale = this.getHintOriginalScale(targetNode);
            if (targetScale.x > 0.01 && targetScale.y > 0.01) {
                return targetScale;
            }
        }

        const hintContainer = this.resolveHintContainer();
        if (hintContainer?.isValid) {
            const existingHint = hintContainer.children.find(child =>
                child.isValid &&
                child.active &&
                child !== targetNode &&
                this.getHintOriginalScale(child).x > 0.01 &&
                this.getHintOriginalScale(child).y > 0.01
            );
            if (existingHint) {
                return this.getHintOriginalScale(existingHint);
            }
        }

        if (this.associatedHint?.isValid && this.associatedHint.active && this.associatedHint.scale.x > 0.01) {
            return this.associatedHint.scale.clone();
        }

        return this.originalHintScale.clone();
    }

private revealNewClues() {
    if (!this.hiddenCluesToUnlock || this.hiddenCluesToUnlock.length === 0) return;
    const revealingClues = this.hiddenCluesToUnlock.filter(clue => clue?.isValid);
    if (revealingClues.length === 0) {
        this.hiddenCluesToUnlock = [];
        return;
    }

    this.showPlusOneBubble(revealingClues.length);

    revealingClues.forEach(clue => {
        clue.active = true;
        (clue.getComponent(UIOpacity) || clue.addComponent(UIOpacity)).opacity = 0; 
    });

    // Hint repositioning is not needed for this flow, so the clues are revealed directly.
    revealingClues.forEach((realClue, index) => {
        const finalPos = realClue.worldPosition.clone();
        const targetScale = this.getHintRevealScale(realClue);
        const flyer = instantiate(realClue);
        director.getScene()?.getChildByName("Canvas")?.addChild(flyer);
        (flyer.getComponent(UIOpacity) || flyer.addComponent(UIOpacity)).opacity = 255;

        flyer.setWorldPosition(this.node.worldPosition);
        flyer.setScale(v3(0, 0, 1));
        flyer.angle = -90;

        tween(flyer)
            .delay(index * 0.2)
            .parallel(
                // Path follows smooth deceleration arc
                tween().to(0.9, { worldPosition: finalPos }, { easing: 'cubicOut' }),
                // Angle settles smoothly
                tween().to(0.9, { angle: 0 }, { easing: 'quadOut' }),
                // Scale bounces in naturally
                tween().to(0.8, { scale: targetScale }, { easing: 'elasticOut' })
            )
            .call(() => {
                flyer.destroy();
                if (realClue?.isValid) {
                    realClue.getComponent(UIOpacity)!.opacity = 255;
                    realClue.setScale(targetScale);

                    // Sound/Voice trigger when the last clue 'snaps' into place
                    if (index === revealingClues.length - 1) {
                        this.playNextAvailableVoice();
                    }
                }
            })
            .start();
    });
    this.hiddenCluesToUnlock = [];
}

    private showPlusOneBubble(count: number = 1) {
        const bubble = new Node("PlusOneBubble");
        director.getScene()?.getChildByName("Canvas")?.addChild(bubble);
        bubble.setWorldPosition(v3(this.node.worldPosition.x, this.node.worldPosition.y + 64, 0));
        bubble.setSiblingIndex(999);
        bubble.setScale(v3(0, 0, 0));
        const g = bubble.addComponent(Graphics);
        g.fillColor = new Color().fromHEX('#64DD17');
        g.roundRect(-70, -25, 140, 50, 25);
        g.fill();
        const labelNode = new Node("Text");
        bubble.addChild(labelNode);
        const l = labelNode.addComponent(Label);
        l.string = count > 1 ? `+${count} New Clues!` : "+1 New Clue!";
        l.fontSize = 20;
        l.color = Color.WHITE;
        tween(bubble).to(0.3, { scale: v3(0.71, 0.71, 0.71) }, { easing: 'backOut' }).delay(1.2).to(0.3, { scale: v3(0, 0, 0) }).call(() => bubble.destroy()).start();
    }

    private getHintChild(targetNode: Node, names: string[]): Node | null {
        for (const name of names) {
            const child = targetNode.getChildByName(name);
            if (child) return child;
        }
        return null;
    }

    private handleHintFeedback(onComplete: Function) {
    const hintTargets: Node[] = [];
    if (this.associatedHint) hintTargets.push(this.associatedHint);
    
    if (this.extraHintsToClear) {
        this.extraHintsToClear.forEach(h => { if (h && hintTargets.indexOf(h) === -1) hintTargets.push(h); });
    }

    // --- LOGIC FOR NODE 9 (NO HINTS TO CLEAR) ---
    if (hintTargets.length === 0) { 
        console.log(`[GRID] No hints to clear for box ${this.node.name}. Proceeding to reveal logic...`);
        onComplete(); 
        if (!this.hiddenCluesToUnlock || this.hiddenCluesToUnlock.length === 0) {
            this.playNextAvailableVoice();
        }
        return; 
    }

    // Identify which hints can ACTUALLY be removed
    const hintsToRemove = hintTargets.filter(targetNode => {
        const isStillNeededByOther = GridController.allBoxes.some(otherBox =>
            otherBox !== this && !otherBox.isSolved && (otherBox.associatedHint === targetNode || (otherBox.extraHintsToClear && otherBox.extraHintsToClear.indexOf(targetNode) !== -1))
        );
        return !isStillNeededByOther;
    });

    // A shared hint stays on screen until every grid cell using it is solved.
    // Pulse it while it is still needed; only completed hints receive a right mark.
    hintTargets
        .filter(hint => hintsToRemove.indexOf(hint) === -1)
        .forEach(hint => this.applyPulse(hint, true));

    // Pop the right mark on each completed hint before that hint flies away.
    const rightMarks = new Set<Node>();
    hintsToRemove.forEach((h) => {
        const tick = this.getHintChild(h, ["RightNode", "Checkmark", "Tick", "TickMark"]);
        if (tick) rightMarks.add(tick);
    });

    // The scene's primary right mark is assigned through the `Right Node` Inspector field.
    if (this.rightNode?.isValid && this.associatedHint && hintsToRemove.indexOf(this.associatedHint) !== -1) {
        rightMarks.add(this.rightNode);
    }

    this.extraRightNodes.forEach((mark, index) => {
        const relatedHint = this.extraHintsToClear[index];
        if (mark?.isValid && relatedHint && hintsToRemove.indexOf(relatedHint) !== -1) {
            rightMarks.add(mark);
        }
    });

    rightMarks.forEach(mark => {
        Tween.stopAllByTarget(mark);
        mark.active = true;
        mark.setScale(v3(0, 0, 0));
        tween(mark).to(0.3, { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
    });

    if (hintsToRemove.length === 0) { onComplete(); return; }

    // FLY OUT ANIMATION
    hintsToRemove.forEach((card, index) => {
        Tween.stopAllByTarget(card);
        card.setScale(this.getHintOriginalScale(card));
        const pin = this.getHintChild(card, ["Pin", "pin", "PinNode"]);
        if (pin) {
            const pinOp = pin.getComponent(UIOpacity) || pin.addComponent(UIOpacity);
            tween(pinOp).to(0.25, { opacity: 0 }).start();
        }

        tween(card)
            .delay(0.4 + (0.15 * index))
            // 1. ANTICIPATION: Small shake/upwards movement
            .to(0.15, { angle: -5, scale: v3(0.3, 0.3, 1) }, { easing: 'sineOut' })
            // 2. RELEASE: Fly away with Cubic easing
            .parallel(
                tween().to(0.7, { position: v3(card.position.x - 900, card.position.y + 400, 0) }, { easing: 'cubicIn' }),
                tween().to(0.7, { angle: 45, scale: v3(0, 0, 1) })
            )
            .call(() => {
                card.active = false;
                PersonClue.notifyClueCompleted(card);
                if (index === hintsToRemove.length - 1) {
                    // Hint repositioning is disabled for this experience.
                    if (!this.hiddenCluesToUnlock || this.hiddenCluesToUnlock.length === 0) {
                        this.playNextAvailableVoice();
                    }
                    onComplete();
                }
            }).start();
    });
}

  private playNextAvailableVoice() {
    if (GridController.isGameOver) return;

    GridController.allBoxes.forEach(box => box.unschedule(box.executeVoiceCall));
    this.scheduleOnce(this.executeVoiceCall, 0.5);
}

private playCurrentHintVoice() {
    if (GridController.isGameOver || !this.hintVoiceClip || !GridController.fxSource) return;

    GridController.fxSource.stop();
    GridController.fxSource.clip = this.hintVoiceClip;
    GridController.fxSource.volume = 1.0;
    GridController.fxSource.play();
}

private executeVoiceCall() {
    if (GridController.isGameOver) return;

    // FIND THE FIRST UNSOLVED BOX WITH AN ACTIVE HINT
    // This is shared across all instances
    const nextBox = GridController.allBoxes.find(box => 
        !box.isSolved && 
        box.associatedHint && 
        box.associatedHint.active === true && 
        box.hintVoiceClip
    );

    if (nextBox && GridController.fxSource) {
        console.log(`[AUDIO] Playing voice for: ${nextBox.node.name}`);
        GridController.fxSource.stop(); // Stop current before starting new
        GridController.fxSource.clip = nextBox.hintVoiceClip;
        GridController.fxSource.volume = 1.0;
        GridController.fxSource.play();
    }
}

    private showRedFrame() {
        const canvas = director.getScene()?.getChildByPath("Canvas");
        let frameNode: Node | null = null;

        if (canvas) {
            frameNode = canvas.getChildByName("ErrorFrame");
            if (!frameNode) {
                frameNode = new Node("ErrorFrame");
                canvas.addChild(frameNode);
            } else if (frameNode.parent !== canvas) {
                frameNode.parent = canvas;
            }
        } else {
            frameNode = this.node.getChildByName("ErrorFrame");
            if (!frameNode) {
                frameNode = new Node("ErrorFrame");
                this.node.addChild(frameNode);
            }
        }

        const graphics = frameNode.getComponent(Graphics) || frameNode.addComponent(Graphics);
        const uiOpacity = frameNode.getComponent(UIOpacity) || frameNode.addComponent(UIOpacity);
        frameNode.active = true;
        uiOpacity.opacity = 255;

        const uiTrans = this.node.getComponent(UITransform);
        const w = uiTrans ? uiTrans.contentSize.width : 100;
        const h = uiTrans ? uiTrans.contentSize.height : 100;

        // Position and scale the frame so it aligns with the grid box in Canvas space
        if (canvas) {
            frameNode.setWorldPosition(this.node.worldPosition);
            const desiredScale = this.getCanvasRelativeScale(this.node.worldScale || this.node.scale);
            frameNode.setScale(desiredScale);

            // Place the ErrorFrame behind the selection menu when the menu is present on the Canvas
            try {
                if (this.selectionMenu && this.selectionMenu.isValid && this.selectionMenu.parent === canvas && this.selectionMenu.active) {
                    const selIndex = this.selectionMenu.getSiblingIndex();
                    frameNode.setSiblingIndex(Math.max(0, selIndex - 1));
                } else {
                    // Default: put on top of Canvas children
                    frameNode.setSiblingIndex(Math.max(0, canvas.children.length - 1));
                }
            } catch (e) {
                frameNode.setSiblingIndex(Math.max(0, canvas.children.length - 1));
            }
        } else {
            frameNode.setPosition(0, 0, 0);
            frameNode.setScale(v3(1, 1, 1));
            frameNode.setSiblingIndex(Math.max(0, this.node.children.length - 1));
        }

        graphics.clear();
        graphics.lineWidth = 18;
        graphics.strokeColor = Color.RED;
        graphics.rect(-w / 2, -h / 2, w, h);
        graphics.stroke();

        const originalScale = frameNode.scale.clone();
        tween(frameNode).to(0.1, { scale: v3(originalScale.x * 1.0, originalScale.y * 1.0, 1) }).to(0.1, { scale: originalScale }).start();
        tween(uiOpacity).to(0.1, { opacity: 100 }).to(0.1, { opacity: 255 }).to(0.1, { opacity: 100 }).to(0.1, { opacity: 255 }).delay(0.6).to(0.2, { opacity: 0 }).call(() => { frameNode!.active = false; }).start();
    }

    private handleIncorrectMove() {
        this.hideTutorialElements("User Choice - Incorrect");
        this.showRedFrame();
        if (this.wrongMatchClip && GridController.fxSource) {
            GridController.fxSource.playOneShot(this.wrongMatchClip, 1);
        }
        const pos = this.selectionMenu.position.clone();
        tween(this.selectionMenu).by(0.05, { position: v3(12, 0, 0) }).by(0.05, { position: v3(-24, 0, 0) }).by(0.05, { position: v3(24, 0, 0) }).by(0.05, { position: v3(-12, 0, 0) }).call(() => { this.selectionMenu.setPosition(pos); this.closeSelectionMenu(); }).start();
        if (GridController.currentMistakes < this.heartSprites.length) {
            const currentHeart = this.heartSprites[GridController.currentMistakes];
            if (currentHeart && this.brokenHeartFrame) {
                tween(currentHeart.node).to(0.1, { scale: v3(0.51, 0.51, 1) }).call(() => currentHeart.spriteFrame = this.brokenHeartFrame).to(0.1, { scale: v3(0.4, 0.4, 1) }).start();
            }
            GridController.currentMistakes++;
            if (GridController.currentMistakes >= this.heartSprites.length) this.handleGameOver("OUT OF LIVES");
        }
    }

    private handleGameOver(reason: string) {
        if (GridController.isGameOver) return;
        GridController.isGameOver = true;
        GridController.isTimerStarted = false;
        if (GridController.bgmSource) GridController.bgmSource.stop();
        if (GridController.fxSource) GridController.fxSource.stop();
        this.hideTutorialElements("Final CTA Show");
        this.closeSelectionMenu();
        if (this.guideNode) { Tween.stopAllByTarget(this.guideNode); this.guideNode.active = false; }

        // A configured next scene takes priority over the win CTA.
        // Read it from any grid cell so it only needs to be assigned once in the Inspector.
        const nextSceneName = GridController.allBoxes
            .map(box => box.nextSceneName.trim())
            .find(sceneName => sceneName.length > 0) || "";
        if (reason === "WIN" && nextSceneName) {
            console.log(`[LEVEL COMPLETE] Loading ${nextSceneName}.`);
            this.scheduleOnce(() => this.loadNextSceneWithTransition(nextSceneName), 0.8);
            return;
        }

        // CTA remains for a failure in either level and for a win in the final level.
        Analytics.instance?.dispatchEvent(reason === "WIN" ? analyticsEvents.CHALLENGE_SOLVED : analyticsEvents.CHALLENGE_FAILED);

        this.triggerGameEndCTA(reason);
    }

    private loadNextSceneWithTransition(sceneName: string) {
        GridController.shouldSlideInNextScene = true;
        director.loadScene(sceneName);
    }

    private slideInScene() {
        const canvas = director.getScene()?.getChildByPath("Canvas");
        if (!canvas) return;

        const canvasTransform = canvas.getComponent(UITransform);
        const finalPosition = canvas.position.clone();
        const screenWidth = canvasTransform?.contentSize.width || 720;
        canvas.setPosition(v3(finalPosition.x + screenWidth, finalPosition.y, finalPosition.z));
        tween(canvas)
            .to(0.4, { position: finalPosition }, { easing: 'cubicOut' })
            .start();
    }

    private triggerGameEndCTA(reason: string) {
        const delay = reason === "WIN" ? 1.3 : 0.15;
        this.scheduleOnce(() => {
            const endScreen = GridController.globalCtaEndScreen || this.ctaEndScreen || director.getScene()?.getChildByPath("Canvas/CTA");

            if (endScreen) {
                console.log(`[GAME OVER CTA] ${reason}. Showing CTA screen.`);
                Analytics.instance?.dispatchEvent(analyticsEvents.ENDCARD_SHOWN);
                endScreen.active = true;
                endScreen.setScale(v3(0, 0, 0));
                endScreen.setSiblingIndex(999);
                tween(endScreen).to(0.5, { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
            } else {
                console.warn("[GAME OVER CTA] CTA screen not found. Falling back to direct redirect.");
                const ctaButtonNode = director.getScene()?.getChildByPath("Canvas/CTA/play_now_pink-removebg-preview");
                const ctaHandler = ctaButtonNode?.getComponent(CTAButtonHandler);
                if (ctaHandler) {
                    ctaHandler.onStoreButtonClicked();
                }
            }
        }, delay);
    }

    public closeSelectionMenu() {
        if (this.selectionMenu) { this.selectionMenu.active = false;
             if (this.selectionTimerBar) Tween.stopAllByTarget(this.selectionTimerBar);
         }
        this.hideSelectedFrame();
        if (GridController.activeBox === this) GridController.activeBox = null;
    }

    public hideTutorialElements(reason: string = "Automatic") {
        GridController.idleTimer = 0;
        GridController.isHandShowing = false;
        this.hideOpeningTutorialOverlay();
        GridController.allBoxes.forEach(box => {
            if (!box.isSolved) box.applyPulse(box.node, false);
            if (box.selectionMenu) {
                box.getSelectionMenuItems().forEach(item => {
                    const savedScale = box.menuItemScales.get(item.name) || box.originalMenuItemScale;
                    item.setScale(savedScale);
                });
                box.refreshSelectionMenuItems();
            }
        });
        if (GridController.globalHandNode) {
            Tween.stopAllByTarget(GridController.globalHandNode);
            GridController.globalHandNode.setScale(v3(0, 0, 0));
            GridController.globalHandNode.active = false;
        }
    }

    
  private showIdleHint(isTutorial: boolean = false) {
    if (GridController.isGameOver || !GridController.globalHandNode) return;
    if (GridController.isHandShowing) return;

    GridController.isHandShowing = true;
    
     // --- ADDED THIS: Show the dotted selection frame ---
    // this.showSelectedFrame();

    // Always pulse the Grid Box
    this.applyPulse(this.node, true);

    // ONLY pulse the hint card if it exists (Node 9 will skip this safely)
    if (this.associatedHint && this.associatedHint.active) {
        this.applyPulse(this.associatedHint, true);
    }

    this.playCurrentHintVoice();
    const hand = GridController.globalHandNode;
    hand.active = true;
    hand.setSiblingIndex(999);
    
    // Move hand to the attached hand node if available, otherwise use the grid box root.
    // `handNode` is the hand artwork, not the target marker. Always target this grid cell.
    // Offset the hand artwork slightly down so its fingertip visually lands at cell centre.
    hand.setWorldPosition(v3(this.node.worldPosition.x + 30, this.node.worldPosition.y - 85, this.node.worldPosition.z));

    hand.setScale(v3(0, 0, 0));
    tween(hand)
        .to(0.3, { scale: GridController.initialHandScale }, { easing: 'backOut' })
        .call(() => this.playHandAnimation())
        .start();
}

    // Show the idle hint but position the hand over a specific child node (by index)
    public showIdleHintOnChildIndex(index: number, isTutorial: boolean = false) {
        if (GridController.isGameOver || !GridController.globalHandNode) return;
        const children = this.node.children.filter(c => c.isValid && c.active);
        if (index < 0 || index >= children.length) {
            // fallback to default
            this.showIdleHint(isTutorial);
            return;
        }
        const targetChild = children[index];
        this.showIdleHintOnNode(targetChild, isTutorial);
    }

    // Show the idle hint on a child node by name
    public showIdleHintOnChildName(childName: string, isTutorial: boolean = false) {
        if (GridController.isGameOver || !GridController.globalHandNode) return;
        const child = this.node.getChildByName(childName);
        if (!child) { this.showIdleHint(isTutorial); return; }
        this.showIdleHintOnNode(child, isTutorial);
    }

    // Core helper: show hand targeted at the given node
    private showIdleHintOnNode(target: Node, isTutorial: boolean = false) {
        if (GridController.isGameOver || !GridController.globalHandNode) return;
        if (GridController.isHandShowing) return;

        GridController.isHandShowing = true;
        this.applyPulse(this.node, true);
        if (this.associatedHint && this.associatedHint.active) this.applyPulse(this.associatedHint, true);

        this.playCurrentHintVoice();
        const hand = GridController.globalHandNode;
        hand.active = true;
        hand.setSiblingIndex(999);

    hand.setWorldPosition(v3(target.worldPosition.x, target.worldPosition.y - 45, target.worldPosition.z));

        hand.setScale(v3(0, 0, 0));
        tween(hand)
            .to(0.3, { scale: GridController.initialHandScale }, { easing: 'backOut' })
            .call(() => this.playHandAnimation())
            .start();
    }

private playHandAnimation() {
    const hand = GridController.globalHandNode;
    if (!hand || !hand.isValid) return;
    const handSprite = hand.getComponent(Sprite);
    const startScale = GridController.initialHandScale.clone();
    const clickScale = v3(startScale.x * 0.82, startScale.y * 0.82, 1);

    Tween.stopAllByTarget(hand);

    tween(hand)
        .repeatForever(
            tween()
                .call(() => {
                    if (handSprite?.isValid) handSprite.spriteFrame = GridController.globalHandIdle!;
                    hand.setScale(startScale);
                })
                .delay(0.9) // Wait before clicking
                .call(() => {
                    // 1. Swap to click sprite
                    if (handSprite?.isValid) handSprite.spriteFrame = GridController.globalHandClick!;
                    
                    // 2. TRIGGER THE YELLOW RIPPLE HERE
                    // Place the ripple just to the right of the hand so it feels attached to the tap
                    const fingerTipPos = v3(hand.worldPosition.x - 20, hand.worldPosition.y + 45, 0);
                    this.spawnClickRipple(fingerTipPos);
                })
                .to(0.12, { scale: clickScale }, { easing: 'quadOut' }) // Smooth press
                .delay(0.12)
                .to(0.24, { scale: startScale }, { easing: 'elasticOut' })  // Smooth elastic release
                .call(() => {
                    if (handSprite?.isValid) handSprite.spriteFrame = GridController.globalHandIdle!;
                })
                .delay(0.6) // Pause between taps
        )
        .start();
}

private repositionHints(skipOpacityFade: Set<Node> = new Set(), onComplete?: Function) {
    const hintContainer = this.resolveHintContainer();
    if (!hintContainer) {
        if (onComplete) onComplete();
        return;
    }
    this.cacheHintOriginalScales();
    const layout = hintContainer.getComponent(Layout);
    if (layout) layout.enabled = false;

    // We only care about active hints that are NOT currently in a "destroying" state
    const activeHints = hintContainer.children.filter(c => c.active && c.scale.x > 0.1);
    if (activeHints.length === 0) {
        if (onComplete) onComplete();
        return;
    }
    
    const MAX_WIDTH = 780; 
    const gapX = 25; // Slightly increased for breathing room
    const gapY = 20;
    let rows: Node[][] = [[]]; 
    let rowWidths: number[] = [0];

    // --- GRID CALCULATION ---
    activeHints.forEach((h) => {
        const hTrans = h.getComponent(UITransform);
        const targetScale = this.getHintOriginalScale(h);
        const w = hTrans ? hTrans.contentSize.width * targetScale.x : 200; // Accurate width after scale
        
        if (rowWidths[rows.length - 1] + w + gapX > MAX_WIDTH && rows[rows.length - 1].length > 0) {
            rows.push([h]); 
            rowWidths.push(w);
        } else {
            const lastIdx = rows.length - 1;
            rowWidths[lastIdx] += (rows[lastIdx].length > 0 ? gapX : 0) + w;
            rows[lastIdx].push(h);
        }
    });

    // --- ANIMATION EXECUTION ---
    let currentY = 10;
    let pendingMoves = activeHints.length;
    const finishMove = () => {
        pendingMoves--;
        if (pendingMoves <= 0 && onComplete) onComplete();
    };

    rows.forEach((rowNodes, rowIndex) => {
        const totalWidth = rowWidths[rowIndex];
        const rowStartX = -(totalWidth / 2);
        let xOff = 0;
        let rowMaxH = 0;

        rowNodes.forEach((h, index) => {
            const hTrans = h.getComponent(UITransform);
            const targetScale = this.getHintOriginalScale(h);
            const w = hTrans ? hTrans.contentSize.width * targetScale.x : 200;
            const tx = rowStartX + xOff + (w / 2);
            const ty = currentY;

            // --- SMOOTH REPOSITIONING ---
            // 1. Stop previous animations to prevent "fighting" tweens
            Tween.stopAllByTarget(h);

            // 2. Natural elastic bounce settle for smooth feel
            tween(h)
                .delay(index * 0.06) // Slightly longer stagger for wave effect
                .to(0.75, { 
                    position: v3(tx, ty, 0),
                    scale: targetScale
                }, { 
                    easing: 'elasticOut' // Smooth elastic bounce
                })
                .call(finishMove)
                .start();

            // Handle opacity fade-in smoothly
            const opacityComp = h.getComponent(UIOpacity) || h.addComponent(UIOpacity);
            if (opacityComp.opacity < 255 && !skipOpacityFade.has(h)) {
                tween(opacityComp)
                    .delay(index * 0.06)
                    .to(0.5, { opacity: 255 }, { easing: 'quadOut' })
                    .start();
            }

            xOff += w + gapX;
            const actualH = hTrans ? hTrans.contentSize.height * targetScale.y : 200;
            if (actualH > rowMaxH) rowMaxH = actualH;
        });
        currentY -= (rowMaxH + gapY);
    });
}

    private playBurst() {
        for (let i = 0; i < 8; i++) {
            const target = v3(Math.cos((i / 8) * Math.PI * 2) * 75, Math.sin((i / 8) * Math.PI * 2) * 75, 0);
            const s = new Node("Burst"); this.node.addChild(s);
            const g = s.addComponent(Graphics); g.fillColor = new Color().fromHEX('#C6F34C');
            const r = 14; g.moveTo(0, r); g.lineTo(r * 0.3, r * 0.3); g.lineTo(r, 0); g.lineTo(r * 0.3, -r * 0.3); g.lineTo(0, -r); g.lineTo(-r * 0.3, -r * 0.3); g.lineTo(-r, 0); g.lineTo(-r * 0.3, r * 0.3); g.close(); g.fill();
            tween(s).parallel(tween().by(0.6, { position: target }, { easing: 'sineOut' }), tween().to(0.6, { scale: v3(3, 3, 3) }), tween().by(0.6, { angle: 180 })).call(() => s.destroy()).start();
        }
    }

    private playSuccessRotation(gridBoxWorldPos: Vec3) {
        if (!this.successRotationEffect) return;
        
        Tween.stopAllByTarget(this.successRotationEffect);
        this.successRotationEffect.active = true;
        this.successRotationEffect.angle = 0;
        
        // Position the effect at the grid box location (behind the item)
        this.successRotationEffect.setWorldPosition(gridBoxWorldPos);
        // Set sibling index to be behind the grid item (but still visible)
        const canvas = director.getScene()?.getChildByPath("Canvas");
        if (canvas) {
            this.successRotationEffect.parent = canvas;
            this.successRotationEffect.setSiblingIndex(Math.max(0, canvas.children.length - 100)); // Behind most UI but visible
        }
        
        // Rotate for 1.5 seconds while the item settles
        tween(this.successRotationEffect)
            .to(1.5, { angle: 360 }, { easing: 'sineOut' })
            .call(() => {
                this.successRotationEffect.active = false;
            })
            .start();
    }

    onDestroy() {
        const idx = GridController.allBoxes.indexOf(this);
        if (idx > -1) GridController.allBoxes.splice(idx, 1);
        if (GridController.timerMaster === this) GridController.timerMaster = null;
    }

    public onCTAClicked() {
        Analytics.instance?.dispatchEvent(analyticsEvents.CTA_CLICKED);
    }

    
}

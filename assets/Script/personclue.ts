import { _decorator, Button, Color, Component, director, Graphics, Node, Tween, UIOpacity, UITransform, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Attach this component to a selectable person at the bottom of the screen.
 * Assign that person's clue cards in order in the Inspector. Selecting the
 * person shows only their next unfinished clue.
 */
@ccclass('PersonClue')
export class PersonClue extends Component {
    @property({ type: [Node], tooltip: 'This person\'s clue cards, in the order they should be revealed.' })
    clues: Node[] = [];

    @property({ type: Node, tooltip: 'A node with GridController attached. GridController controls which clue is active.' })
    gridControllerNode: Node | null = null;

    @property({ type: Node, tooltip: 'Optional highlight/ring shown while this person is selected.' })
    selectedFrame: Node | null = null;

    @property(Color)
    selectionDotColor: Color = new Color(92, 202, 190, 255);

    @property({ tooltip: 'Hide this person after every assigned clue has been completed.' })
    hideWhenAllCluesComplete = true;

    @property({ tooltip: 'Select this person automatically when the scene opens.' })
    selectOnStart = false;

    private static people = new Set<PersonClue>();
    private static completedClues = new Set<Node>();
    private static selectedPerson: PersonClue | null = null;
    private usesButton = false;
    private selectionDot: Node | null = null;

    onLoad() {
        PersonClue.people.add(this);
        this.selectedFrame && (this.selectedFrame.active = false);
        this.createSelectionDot();

        const button = this.getComponent(Button);
        this.usesButton = !!button;
        if (button) button.node.on(Button.EventType.CLICK, this.onPersonPressed, this);
        else this.node.on(Node.EventType.TOUCH_END, this.onPersonPressed, this);
    }

    start() {
        this.getGridController()?.registerPersonClues(this.clues);
        if (this.selectOnStart && this.node.active) this.onPersonPressed();
    }

    onDestroy() {
        const button = this.getComponent(Button);
        if (button) button.node.off(Button.EventType.CLICK, this.onPersonPressed, this);
        if (!this.usesButton) this.node.off(Node.EventType.TOUCH_END, this.onPersonPressed, this);
        PersonClue.people.delete(this);
        if (PersonClue.selectedPerson === this) PersonClue.selectedPerson = null;
    }

    /** Assign this method to a Button Click Event if this node has no Button component. */
    public onPersonPressed() {
        if (!this.node.active || this.areAllCluesComplete()) return;
        this.selectAndShowNextClue();
    }

    private selectAndShowNextClue() {
        PersonClue.selectedPerson = this;
        PersonClue.people.forEach(person => {
            const isSelected = person === this;
            if (person.selectedFrame?.isValid) person.selectedFrame.active = isSelected;
            person.setSelectionDotVisible(isSelected);
        });

        const nextClue = this.getNextUnfinishedClue();
        if (nextClue) {
            const gridController = this.getGridController();
            if (gridController) gridController.showPersonClue(nextClue, this.node);
            else console.warn(`[PersonClue] Assign Grid Controller Node for ${this.node.name}.`);
        }
    }

    /** Called by GridController after its completed clue-card animation finishes. */
    public static notifyClueCompleted(clue: Node) {
        if (!clue?.isValid) return;
        PersonClue.completedClues.add(clue);
        let completedOwner: PersonClue | null = null;

        PersonClue.people.forEach(person => {
            if (person.clues.indexOf(clue) === -1) return;
            completedOwner = person;

            if (person.areAllCluesComplete() && person.hideWhenAllCluesComplete) {
                if (person.selectedFrame?.isValid) person.selectedFrame.active = false;
                person.node.active = false;
                if (PersonClue.selectedPerson === person) PersonClue.selectedPerson = null;
            }
        });

        // Match the reference flow: immediately reveal the next clue rather than
        // waiting for the player to tap another portrait.
        const nextPerson = completedOwner && !completedOwner.areAllCluesComplete()
            ? completedOwner
            : Array.from(PersonClue.people).find(person => person.node.active && !person.areAllCluesComplete()) || null;
        if (nextPerson) nextPerson.selectAndShowNextClue();
    }

    private getNextUnfinishedClue(): Node | null {
        return this.clues.find(clue => clue?.isValid && !PersonClue.completedClues.has(clue)) || null;
    }

    private areAllCluesComplete(): boolean {
        const validClues = this.clues.filter(clue => clue?.isValid);
        return validClues.length > 0 && validClues.every(clue => PersonClue.completedClues.has(clue));
    }

    private getGridController(): { registerPersonClues(clues: Node[]): void; showPersonClue(clue: Node, personNode?: Node | null): void } | null {
        if (!this.gridControllerNode?.isValid) {
            this.gridControllerNode = this.findGridControllerNode(director.getScene() as unknown as Node);
        }
        if (!this.gridControllerNode?.isValid) return null;
        return this.gridControllerNode.getComponent('GridController') as unknown as { registerPersonClues(clues: Node[]): void; showPersonClue(clue: Node, personNode?: Node | null): void } | null;
    }

    private findGridControllerNode(node: Node | null): Node | null {
        if (!node?.isValid) return null;
        if (node.getComponent('GridController')) return node;

        for (const child of node.children) {
            const result = this.findGridControllerNode(child);
            if (result) return result;
        }
        return null;
    }

    private createSelectionDot() {
        const transform = this.getComponent(UITransform);
        if (!transform) return;

        const dot = new Node('PersonSelectionDot');
        this.node.addChild(dot);
        dot.addComponent(UITransform).setContentSize(24, 24);
        const graphics = dot.addComponent(Graphics);
        graphics.fillColor = this.selectionDotColor;
        graphics.circle(0, 0, 10);
        graphics.fill();
        dot.setPosition(v3(0, -(transform.contentSize.height / 2) - 18, 0));
        dot.setScale(v3(0, 0, 1));
        dot.addComponent(UIOpacity).opacity = 0;
        dot.active = false;
        this.selectionDot = dot;
    }

    private setSelectionDotVisible(isVisible: boolean) {
        if (!this.selectionDot?.isValid) return;
        Tween.stopAllByTarget(this.selectionDot);

        if (isVisible) {
            this.selectionDot.active = true;
            this.selectionDot.setScale(v3(0.55, 0.55, 1));
            const opacity = this.selectionDot.getComponent(UIOpacity)!;
            opacity.opacity = 0;
            tween(this.selectionDot)
                .delay(0.12)
                .to(0.24, { scale: v3(1, 1, 1) }, { easing: 'sineOut' })
                .start();
            tween(opacity).delay(0.12).to(0.18, { opacity: 255 }, { easing: 'sineOut' }).start();
        } else if (this.selectionDot.active) {
            const opacity = this.selectionDot.getComponent(UIOpacity)!;
            tween(this.selectionDot)
                .to(0.16, { scale: v3(0.65, 0.65, 1) }, { easing: 'sineIn' })
                .call(() => { if (this.selectionDot?.isValid) this.selectionDot.active = false; })
                .start();
            tween(opacity).to(0.14, { opacity: 0 }, { easing: 'sineIn' }).start();
        }
    }
}

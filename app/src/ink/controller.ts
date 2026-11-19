import { replayTransition, switchTheme, type Point } from './viewInk'

export type { Point }
export const toggleTheme = (point?: Point) => switchTheme(point)
export const replayTheme = () => replayTransition()

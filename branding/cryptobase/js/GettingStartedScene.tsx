import * as React from 'react'
import { Image, Platform, Pressable, View } from 'react-native'
import { GestureDetector, ScrollView } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'

// 🔥 REBRANDED: Replaced Edge icon with Cryptobase icon
import cbLogoIcon from '../../assets/images/cbatmLogo/Cryptobase_logo_Icon.png'

import uspImage0 from '../../assets/images/gettingStarted/usp0.png'
import uspImage1 from '../../assets/images/gettingStarted/usp1.png'
import uspImage2 from '../../assets/images/gettingStarted/usp2.png'
import uspImage3 from '../../assets/images/gettingStarted/usp3.png'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import type { ExperimentConfig } from '../../experimentConfig'
import { useCarouselGesture } from '../../hooks/useCarouselGesture'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { RootSceneProps } from '../../types/routerTypes'
import type { ImageProp } from '../../types/Theme'
import { parseMarkedText } from '../../util/parseMarkedText'
import { logEvent } from '../../util/tracking'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeAnim, fadeIn, fadeOut } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { Space } from '../layout/Space'
import { UnscaledText } from '../text/UnscaledText'
import { EdgeText } from '../themed/EdgeText'

const ANIM_DURATION = 1000

export interface GettingStartedParams {
  experimentConfig: ExperimentConfig
}

interface Props extends RootSceneProps<'gettingStarted'> {}

interface SectionData {
  image: ImageProp
  key: string
  footnote?: string
  message: string
  title: string
}

const sections: SectionData[] = [
  {
    image: uspImage0,
    key: 'slide1',
    message: lstrings.getting_started_slide_1_message,
    title: lstrings.getting_started_slide_1_title,
    footnote: lstrings.getting_started_slide_1_footnote
  },
  {
    image: uspImage1,
    key: 'slide2',
    message: lstrings.getting_started_slide_2_message,
    title: lstrings.getting_started_slide_2_title
  },
  {
    image: uspImage2,
    key: 'slide3',
    message: lstrings.getting_started_slide_3_message,
    title: lstrings.getting_started_slide_3_title
  },
  {
    image: uspImage3,
    key: 'slide4',
    message: lstrings.getting_started_slide_4_message,
    title: lstrings.getting_started_slide_4_title
  }
]

export const GettingStartedScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const dispatch = useDispatch()
  const { experimentConfig } = route.params
  const context = useSelector(state => state.core.context)
  const hasLocalUsers = context.localUsers.length > 0

  const [showNextButton, setShowNextButton] = React.useState(false)

  const handleIndexChange = (index: number): void => {
    if (index > 0 && !showNextButton) {
      setShowNextButton(true)
    } else if (index <= 0 && showNextButton) {
      setShowNextButton(false)
    }

    if (index === paginationCount) {
      handleCompleteUsps()
    }
  }

  const paginationCount = sections.length + 1
  const { width: screenWidth } = useSafeAreaFrame()
  const { gesture, scrollIndex } = useCarouselGesture(
    paginationCount + 1,
    screenWidth,
    handleIndexChange
  )

  const visitPasswordScene = (): void => {
    navigation.replace('login', {
      loginUiInitialRoute: 'login-password',
      experimentConfig
    })
  }

  const visitNewAccountScene = (): void => {
    navigation.replace('login', {
      loginUiInitialRoute: hasLocalUsers
        ? 'new-account'
        : 'new-light-account',
      experimentConfig
    })
  }

  const handleCompleteUsps = useHandler(() => {
    setTimeout(() => {
      scrollIndex.value = 0
      handleIndexChange(0)
    }, 500)

    dispatch(logEvent('Signup_Welcome'))

    if (hasLocalUsers) {
      visitPasswordScene()
    } else {
      visitNewAccountScene()
    }
  })

  const handlePressIndicator = useHandler((itemIndex: number) => {
    scrollIndex.value = withTiming(itemIndex)
    handleIndexChange(itemIndex)
  })

  const handlePressSignIn = useHandler(() => {
    dispatch(logEvent('Welcome_Signin'))
    visitPasswordScene()
  })

  const handleProgressButtonPress = useHandler(() => {
    if (scrollIndex.value >= sections.length) {
      dispatch(logEvent('Signup_Welcome'))
      handleCompleteUsps()
    } else {
      const nextIndex = Math.min(
        Math.floor(scrollIndex.value) + 1,
        sections.length
      )
      scrollIndex.value = withTiming(nextIndex)
      handleIndexChange(nextIndex)
    }
  })

  const footerButtons = (
    <>
      <ButtonFadeContainer>
        <EdgeAnim visible={!showNextButton} enter={fadeIn} exit={fadeOut}>
          <ButtonsView
            layout="column"
            primary={{
              label: lstrings.account_get_started,
              onPress: handleProgressButtonPress
            }}
          />
        </EdgeAnim>

        <EdgeAnim visible={showNextButton} enter={fadeIn} exit={fadeOut}>
          <ButtonsView
            layout="column"
            primary={{
              label: lstrings.string_next_capitalized,
              onPress: handleProgressButtonPress
            }}
          />
        </EdgeAnim>
      </ButtonFadeContainer>
      <TertiaryTouchable onPress={handlePressSignIn}>
        <TertiaryText>
          {lstrings.getting_started_already_have_an_account}
          <TappableText>{lstrings.getting_started_sign_in}</TappableText>
        </TertiaryText>
      </TertiaryTouchable>
    </>
  )

  return (
    <SceneWrapper hasHeader={false}>
      <SkipButton swipeOffset={scrollIndex}>
        <Space alignRight horizontalRem={1} verticalRem={0.5}>
          <EdgeTouchableOpacity onPress={handleCompleteUsps}>
            <EdgeText>{lstrings.skip}</EdgeText>
          </EdgeTouchableOpacity>
        </Space>
      </SkipButton>
      <GestureDetector gesture={gesture}>
        <Container>
          <HeroContainer>
            <WelcomeHero swipeOffset={scrollIndex}>
              <EdgeAnim
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 80
                }}
              >
                {/* 🔥 REBRANDED: Cryptobase logo */}
                <Image source={cbLogoIcon} />
              </EdgeAnim>

              <EdgeAnim
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 60
                }}
              >
                <WelcomeHeroTitle
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {parseMarkedText(lstrings.getting_started_welcome_title)}
                </WelcomeHeroTitle>
              </EdgeAnim>

              <EdgeAnim
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 40
                }}
              >
                <WelcomeHeroMessage>
                  {lstrings.getting_started_welcome_message}
                </WelcomeHeroMessage>
              </EdgeAnim>

              <EdgeAnim
                enter={{
                  type: 'fadeInUp',
                  duration: ANIM_DURATION,
                  distance: 20
                }}
              >
                <EdgeTouchableOpacity onPress={handleProgressButtonPress}>
                  <WelcomeHeroPrompt>{lstrings.learn_more}</WelcomeHeroPrompt>
                </EdgeTouchableOpacity>
              </EdgeAnim>
            </WelcomeHero>

            {sections.map((section, index) => {
              return (
                <HeroItem
                  key={section.key}
                  swipeOffset={scrollIndex}
                  itemIndex={index + 1}
                >
                  <HeroImageContainer>
                    <HeroImage source={section.image} />
                  </HeroImageContainer>
                </HeroItem>
              )
            })}
          </HeroContainer>

          <Pagination>
            {Array.from({ length: paginationCount }).map((_, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  handlePressIndicator(index)
                }}
              >
                <PageIndicator swipeOffset={scrollIndex} itemIndex={index} />
              </Pressable>
            ))}
          </Pagination>

          <SectionCoverAnimated swipeOffset={scrollIndex}>
            <Sections swipeOffset={scrollIndex}>
              {sections.map((section, index) => {
                return (
                  <Section
                    key={section.key}
                    swipeOffset={scrollIndex}
                    itemIndex={index + 1}
                  >
                    <ScrollView
                      scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
                    >
                      <SectionTitle numberOfLines={2}>
                        {parseMarkedText(section.title)}
                      </SectionTitle>

                      <SectionParagraph numberOfLines={undefined}>
                        {section.message}
                      </SectionParagraph>

                      {section.footnote == null ? null : (
                        <Footnote numberOfLines={undefined}>
                          {lstrings.getting_started_slide_1_footnote}
                        </Footnote>
                      )}
                    </ScrollView>
                  </Section>
                )
              })}
            </Sections>

            {footerButtons}
          </SectionCoverAnimated>
        </Container>
      </GestureDetector>
    </SceneWrapper>
  )
}

// (STYLES REMAIN UNCHANGED…)
